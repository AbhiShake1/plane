import { observable, action, makeObservable, runInAction, computed } from "mobx";
// services
import { IssueService } from "services/issue";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { RootStore } from "../root";
import { IIssue, IIssueFilterOptions } from "types";
import {
  IIssueGroupWithSubGroupsStructure,
  IIssueGroupedStructure,
  IIssueUnGroupedStructure,
} from "../module/module_issue.store";
// helpers
import { sortArrayByDate, sortArrayByPriority } from "constants/kanban-helpers";

export interface IProjectViewIssuesStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  viewIssues: {
    [viewId: string]: {
      grouped: IIssueGroupedStructure;
      groupWithSubGroups: IIssueGroupWithSubGroupsStructure;
      ungrouped: IIssueUnGroupedStructure;
    };
  };

  // actions
  updateIssueStructure: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
  fetchViewIssues: (
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    filters: IIssueFilterOptions
  ) => Promise<any>;

  // computed
  getIssues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null;
}

export class ProjectViewIssuesStore implements IProjectViewIssuesStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  viewIssues: {
    [viewId: string]: {
      grouped: IIssueGroupedStructure;
      groupWithSubGroups: IIssueGroupWithSubGroupsStructure;
      ungrouped: IIssueUnGroupedStructure;
    };
  } = {};

  // root store
  rootStore;

  // services
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      viewIssues: observable.ref,

      // actions
      updateIssueStructure: action,
      fetchViewIssues: action,

      // computed
      getIssues: computed,
    });

    this.rootStore = _rootStore;

    this.issueService = new IssueService();
  }

  computedFilter = (filters: any, filteredParams: any) => {
    const computedFilters: any = {};
    Object.keys(filters).map((key) => {
      if (filters[key] != undefined && filteredParams.includes(key))
        computedFilters[key] =
          typeof filters[key] === "string" || typeof filters[key] === "boolean" ? filters[key] : filters[key].join(",");
    });

    return computedFilters;
  };

  get getIssues() {
    const viewId: string | null = this.rootStore.projectViews.viewId;
    const issueType = this.rootStore.issue.getIssueType;

    if (!viewId || !issueType) return null;

    return this.viewIssues?.[viewId]?.[issueType] || null;
  }

  updateIssueStructure = async (group_id: string | null, sub_group_id: string | null, issue: IIssue) => {
    const viewId: string | null = this.rootStore.projectViews.viewId;
    const issueType = this.rootStore.issue.getIssueType;
    if (!viewId || !issueType) return null;

    let issues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null =
      this.getIssues;
    if (!issues) return null;

    if (issueType === "grouped" && group_id) {
      issues = issues as IIssueGroupedStructure;
      issues = {
        ...issues,
        [group_id]: issues[group_id].map((i: IIssue) => (i?.id === issue?.id ? { ...i, ...issue } : i)),
      };
    }
    if (issueType === "groupWithSubGroups" && group_id && sub_group_id) {
      issues = issues as IIssueGroupWithSubGroupsStructure;
      issues = {
        ...issues,
        [sub_group_id]: {
          ...issues[sub_group_id],
          [group_id]: issues[sub_group_id][group_id].map((i) => (i?.id === issue?.id ? { ...i, ...issue } : i)),
        },
      };
    }
    if (issueType === "ungrouped") {
      issues = issues as IIssueUnGroupedStructure;
      issues = issues.map((i) => (i?.id === issue?.id ? { ...i, ...issue } : i));
    }

    const orderBy = this.rootStore?.issueFilter?.userDisplayFilters?.order_by || "";
    if (orderBy === "-created_at") {
      issues = sortArrayByDate(issues as any, "created_at");
    }
    if (orderBy === "-updated_at") {
      issues = sortArrayByDate(issues as any, "updated_at");
    }
    if (orderBy === "start_date") {
      issues = sortArrayByDate(issues as any, "updated_at");
    }
    if (orderBy === "priority") {
      issues = sortArrayByPriority(issues as any, "priority");
    }

    runInAction(() => {
      this.viewIssues = { ...this.viewIssues, [viewId]: { ...this.viewIssues[viewId], [issueType]: issues } };
    });
  };

  fetchViewIssues = async (workspaceSlug: string, projectId: string, viewId: string, filters: IIssueFilterOptions) => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const displayFilters = this.rootStore.issueFilter.userDisplayFilters;

      let filteredRouteParams: any = {
        priority: filters?.priority || undefined,
        state_group: filters?.state_group || undefined,
        state: filters?.state || undefined,
        assignees: filters?.assignees || undefined,
        created_by: filters?.created_by || undefined,
        labels: filters?.labels || undefined,
        start_date: filters?.start_date || undefined,
        target_date: filters?.target_date || undefined,
        group_by: displayFilters?.group_by || undefined,
        order_by: displayFilters?.order_by || "-created_at",
        type: displayFilters?.type || undefined,
        sub_issue: displayFilters.sub_issue || undefined,
        sub_group_by: displayFilters.sub_group_by || undefined,
      };

      const filteredParams = handleIssueQueryParamsByLayout(displayFilters.layout ?? "list", "issues");
      if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

      if (displayFilters.layout === "calendar") filteredRouteParams.group_by = "target_date";
      if (displayFilters.layout === "gantt_chart") filteredRouteParams.start_target_date = true;

      const response = await this.issueService.getIssuesWithParams(workspaceSlug, projectId, filteredRouteParams);

      const issueType = this.rootStore.issue.getIssueType;

      if (issueType != null) {
        const newIssues = {
          ...this.viewIssues,
          [viewId]: {
            ...this.viewIssues[viewId],
            [issueType]: response,
          },
        };

        runInAction(() => {
          this.loader = false;
          this.viewIssues = newIssues;
        });
      }

      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };
}

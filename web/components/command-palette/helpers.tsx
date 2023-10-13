// types
import { ContrastIcon, DiceIcon, LayersIcon, PhotoFilterIcon } from "@plane/ui";
import { Briefcase, Grid2x2, Newspaper } from "lucide-react";
import {
  IWorkspaceDefaultSearchResult,
  IWorkspaceIssueSearchResult,
  IWorkspaceProjectSearchResult,
  IWorkspaceSearchResult,
} from "types";

export const commandGroups: {
  [key: string]: {
    icon: any;
    itemName: (item: any) => React.ReactNode;
    path: (item: any) => string;
    title: string;
  };
} = {
  cycle: {
    icon: ContrastIcon,
    itemName: (cycle: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-custom-text-200 text-xs">{cycle.project__identifier}</span>
        {"- "}
        {cycle.name}
      </h6>
    ),
    path: (cycle: IWorkspaceDefaultSearchResult) =>
      `/${cycle?.workspace__slug}/projects/${cycle?.project_id}/cycles/${cycle?.id}`,
    title: "Cycles",
  },
  issue: {
    icon: LayersIcon,
    itemName: (issue: IWorkspaceIssueSearchResult) => (
      <h6>
        <span className="text-custom-text-200 text-xs">{issue.project__identifier}</span>
        {"- "}
        {issue.name}
      </h6>
    ),
    path: (issue: IWorkspaceIssueSearchResult) =>
      `/${issue?.workspace__slug}/projects/${issue?.project_id}/issues/${issue?.id}`,
    title: "Issues",
  },
  issue_view: {
    icon: PhotoFilterIcon,
    itemName: (view: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-custom-text-200 text-xs">{view.project__identifier}</span>
        {"- "}
        {view.name}
      </h6>
    ),
    path: (view: IWorkspaceDefaultSearchResult) =>
      `/${view?.workspace__slug}/projects/${view?.project_id}/views/${view?.id}`,
    title: "Views",
  },
  module: {
    icon: DiceIcon,
    itemName: (module: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-custom-text-200 text-xs">{module.project__identifier}</span>
        {"- "}
        {module.name}
      </h6>
    ),
    path: (module: IWorkspaceDefaultSearchResult) =>
      `/${module?.workspace__slug}/projects/${module?.project_id}/modules/${module?.id}`,
    title: "Modules",
  },
  page: {
    icon: Newspaper,
    itemName: (page: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-custom-text-200 text-xs">{page.project__identifier}</span>
        {"- "}
        {page.name}
      </h6>
    ),
    path: (page: IWorkspaceDefaultSearchResult) =>
      `/${page?.workspace__slug}/projects/${page?.project_id}/pages/${page?.id}`,
    title: "Pages",
  },
  project: {
    icon: Briefcase,
    itemName: (project: IWorkspaceProjectSearchResult) => project?.name,
    path: (project: IWorkspaceProjectSearchResult) => `/${project?.workspace__slug}/projects/${project?.id}/issues/`,
    title: "Projects",
  },
  workspace: {
    icon: Grid2x2,
    itemName: (workspace: IWorkspaceSearchResult) => workspace?.name,
    path: (workspace: IWorkspaceSearchResult) => `/${workspace?.slug}/`,
    title: "Workspaces",
  },
};

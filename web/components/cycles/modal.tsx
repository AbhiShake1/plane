import React, { useEffect, useState } from "react";
import { mutate } from "swr";
import { Dialog, Transition } from "@headlessui/react";
// services
import { CycleService } from "services/cycle.service";
// hooks
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CycleForm } from "components/cycles";
// helper
import { getDateRangeStatus } from "helpers/date-time.helper";
// types
import type { CycleDateCheckData, ICycle, IProject, IUser } from "types";
// fetch keys
import {
  COMPLETED_CYCLES_LIST,
  CURRENT_CYCLE_LIST,
  CYCLES_LIST,
  DRAFT_CYCLES_LIST,
  INCOMPLETE_CYCLES_LIST,
  PROJECT_DETAILS,
  UPCOMING_CYCLES_LIST,
} from "constants/fetch-keys";

type CycleModalProps = {
  isOpen: boolean;
  handleClose: () => void;
  data?: ICycle | null;
  workspaceSlug: string;
  projectId: string;
};

// services
const cycleService = new CycleService();

export const CreateUpdateCycleModal: React.FC<CycleModalProps> = (props) => {
  const { isOpen, handleClose, data, workspaceSlug, projectId } = props;
  const [activeProject, setActiveProject] = useState<string | null>(null);

  const { project: projectStore } = useMobxStore();
  const projects = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined;

  const { setToastAlert } = useToast();

  const createCycle = async (payload: Partial<ICycle>) => {
    await cycleService
      .createCycle(workspaceSlug.toString(), projectId.toString(), payload, {} as IUser)
      .then((res) => {
        switch (getDateRangeStatus(res.start_date, res.end_date)) {
          case "completed":
            mutate(COMPLETED_CYCLES_LIST(projectId.toString()));
            break;
          case "current":
            mutate(CURRENT_CYCLE_LIST(projectId.toString()));
            break;
          case "upcoming":
            mutate(UPCOMING_CYCLES_LIST(projectId.toString()));
            break;
          default:
            mutate(DRAFT_CYCLES_LIST(projectId.toString()));
        }
        mutate(INCOMPLETE_CYCLES_LIST(projectId.toString()));
        mutate(CYCLES_LIST(projectId.toString()));

        // update total cycles count in the project details
        mutate<IProject>(
          PROJECT_DETAILS(projectId.toString()),
          (prevData) => {
            if (!prevData) return prevData;

            return {
              ...prevData,
              total_cycles: prevData.total_cycles + 1,
            };
          },
          false
        );

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Cycle created successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Error in creating cycle. Please try again.",
        });
      });
  };

  const updateCycle = async (cycleId: string, payload: Partial<ICycle>) => {
    await cycleService
      .updateCycle(workspaceSlug.toString(), projectId.toString(), cycleId, payload, {} as IUser)
      .then((res) => {
        switch (getDateRangeStatus(data?.start_date, data?.end_date)) {
          case "completed":
            mutate(COMPLETED_CYCLES_LIST(projectId.toString()));
            break;
          case "current":
            mutate(CURRENT_CYCLE_LIST(projectId.toString()));
            break;
          case "upcoming":
            mutate(UPCOMING_CYCLES_LIST(projectId.toString()));
            break;
          default:
            mutate(DRAFT_CYCLES_LIST(projectId.toString()));
        }
        mutate(CYCLES_LIST(projectId.toString()));
        if (getDateRangeStatus(data?.start_date, data?.end_date) != getDateRangeStatus(res.start_date, res.end_date)) {
          switch (getDateRangeStatus(res.start_date, res.end_date)) {
            case "completed":
              mutate(COMPLETED_CYCLES_LIST(projectId.toString()));
              break;
            case "current":
              mutate(CURRENT_CYCLE_LIST(projectId.toString()));
              break;
            case "upcoming":
              mutate(UPCOMING_CYCLES_LIST(projectId.toString()));
              break;
            default:
              mutate(DRAFT_CYCLES_LIST(projectId.toString()));
          }
        }

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Cycle updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Error in updating cycle. Please try again.",
        });
      });
  };

  const dateChecker = async (payload: CycleDateCheckData) => {
    let status = false;

    await cycleService.cycleDateCheck(workspaceSlug as string, projectId as string, payload).then((res) => {
      status = res.status;
    });

    return status;
  };

  const handleFormSubmit = async (formData: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<ICycle> = {
      ...formData,
    };

    let isDateValid: boolean = true;

    if (payload.start_date && payload.end_date) {
      if (data?.start_date && data?.end_date)
        isDateValid = await dateChecker({
          start_date: payload.start_date,
          end_date: payload.end_date,
          cycle_id: data.id,
        });
      else
        isDateValid = await dateChecker({
          start_date: payload.start_date,
          end_date: payload.end_date,
        });
    }

    if (isDateValid) {
      if (data) await updateCycle(data.id, payload);
      else await createCycle(payload);
      handleClose();
    } else
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "You already have a cycle on the given dates, if you want to create a draft cycle, remove the dates.",
      });
  };

  useEffect(() => {
    // if modal is closed, reset active project to null
    // and return to avoid activeProject being set to some other project
    if (!isOpen) {
      setActiveProject(null);
      return;
    }

    // if data is present, set active project to the project of the
    // issue. This has more priority than the project in the url.
    if (data && data.project) {
      setActiveProject(data.project);
      return;
    }

    // if data is not present, set active project to the project
    // in the url. This has the least priority.
    if (projects && projects.length > 0 && !activeProject)
      setActiveProject(projects?.find((p) => p.id === projectId)?.id ?? projects?.[0].id ?? null);
  }, [activeProject, data, projectId, projects, isOpen]);

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 p-5 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                <CycleForm
                  handleFormSubmit={handleFormSubmit}
                  handleClose={handleClose}
                  projectId={activeProject ?? ""}
                  setActiveProject={setActiveProject}
                  data={data}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

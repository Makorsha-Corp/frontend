import { ApplicationSettings, OrderedPart, Status, StatusTracker, StatusTrackerItemProp } from "@/types";


export function getStatusDataForWorkflow(
  statuses: Status[],
  statusTracker: StatusTracker[],
  status_sequence: number[],
  current_status_id: number
) {
  // Map: status_id -> tracker row (only for displaying action_at/action_by)
  const trackerMap = new Map<number, StatusTracker>();
  for (const t of statusTracker) trackerMap.set(t.status_id, t);

  // Map: status_id -> status name
  const statusMap = new Map<number, string>();
  for (const s of statuses) statusMap.set(s.id, s.name);

  // Index positions in the workflow
  const idxById = new Map<number, number>(
    status_sequence.map((id, i) => [id, i])
  );
  const currentIdx = idxById.get(current_status_id) ?? -1;
  const lastIdx = status_sequence.length - 1;

  return status_sequence.map((status_id) => {
    const seqIdx = idxById.get(status_id) ?? -1;
    const tracker = trackerMap.get(status_id);

    const isPast = currentIdx >= 0 && seqIdx >= 0 && seqIdx < currentIdx;
    const isCurrent = seqIdx === currentIdx;
    const isLastCurrent = isCurrent && seqIdx === lastIdx;

    // Completion/Color rules (NO dependency on tracker presence):
    // - Past steps are complete (green)
    // - Current step is yellow, unless it's also last -> green
    // - Future steps are not complete (red)
    const complete = isPast || isLastCurrent;

    return {
      status: statusMap.get(status_id) || "",
      action_at: tracker?.action_at || null,
      action_by: tracker?.profiles?.name || null,
      complete,        // drives green/red
      isCurrent,       // drives yellow styling when !complete
    };
  });
}


export function getStatusDurations(statuses: StatusTrackerItemProp[]) {
  const completed = statuses.filter((s) => s.complete && s.action_at);

  if (completed.length === 0) return { elapsedDays: null, totalDaysToCompletion: null };

  const first = new Date(completed[0].action_at!);
  const last = new Date(completed[completed.length - 1].action_at!);
  const now = new Date();

  const elapsedMs = now.getTime() - first.getTime();
  const totalMs = last.getTime() - first.getTime();

  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const totalDaysToCompletion = completed.length === statuses.length
    ? Math.floor(totalMs / (1000 * 60 * 60 * 24))
    : null;

  return { elapsedDays, totalDaysToCompletion };
}

export function getWorkflowProgress(
  status_sequence: number[],
  current_status_id: number
): { completedCount: number; totalCount: number } {
  const totalCount = status_sequence.length;

  const currentIndex = status_sequence.indexOf(current_status_id);
  const completedCount =
    currentIndex === -1 ? 0 : currentIndex + 1; // +1 because index is 0-based

  return { completedCount, totalCount };
}


export const convertUtcToBDTime = (utcTimestamp: string): string => {
  // Parse the UTC timestamp into a Date object
  const date = new Date(utcTimestamp);

  // Check if the Date object is valid
  if (isNaN(date.getTime())) {
    throw new Error('Invalid UTC timestamp');
  }

  // Bangladesh is UTC+6, so we add 6 hours to convert UTC to Bangladesh time
  const bdOffset = 6 * 60 * 60 * 1000;
  const bdDate = new Date(date.getTime() + bdOffset);

  // Extract the year, month, day, hours, and minutes
  const year = bdDate.getUTCFullYear();
  const month = bdDate.toLocaleString('en-GB', { month: 'short' }); // Get the month name in short format (e.g., 'Oct')
  const day = bdDate.getUTCDate().toString(); // Day of the month
  const hours = bdDate.getUTCHours().toString().padStart(2, '0'); // Hours in 24-hour format
  const minutes = bdDate.getUTCMinutes().toString().padStart(2, '0'); // Minutes with leading zero

  // Return the formatted date as '4 Oct 2024, hh:mm'
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};


export const convertBDTimeToUtc = (bdTimestamp: string): string => {
  // Parse the date parts manually
  const [datePart, timePart] = bdTimestamp.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);

  // Create a date object using the provided Bangladesh time parts
  const bdDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

  // Bangladesh is UTC+6, so we subtract 6 hours
  const bdOffset = 6 * 60 * 60 * 1000;
  const utcDate = new Date(bdDate.getTime() - bdOffset);

  // Return the UTC time in ISO format
  return utcDate.toISOString();
};

export const isRevertStatusAllowed = (ordered_parts: OrderedPart[], current_status: string) => {
  // const partsToCheck = ordered_parts.filter(part =>!(part.in_storage && part.approved_storage_withdrawal && part.qty===0));

  // if (current_status==="Budget Released" || current_status==="Waiting For Purchase"){
  //   return partsToCheck.some(part => part.vendor === null || part.unit_cost === null || part.brand === null);
  // }
  // else if (current_status==="Parts Received"){
  //   return partsToCheck.some(part => (part.vendor === null || part.unit_cost === null || part.brand === null || part.approved_budget=== false || part.part_purchased_date===null || part.part_received_by_factory_date===null|| part.part_sent_by_office_date===null
  //   ));
  // }

  return false
}


export const isLastStatusInWorkflow = (statusSequence: number[], currentStatusId: number): boolean => {
  if (!Array.isArray(statusSequence) || statusSequence.length === 0) return false;
  return statusSequence[statusSequence.length - 1] === currentStatusId;
};



/**
 * Given the current status ID and the full sequence of statuses,
 * returns the next status ID, or null if already at the end.
 */
export const getNextStatusIdFromSequence = (statusSequence: number[],currentStatusId: number): number | null => {
  const currentIndex = statusSequence.indexOf(currentStatusId);
  if (currentIndex === -1 || currentIndex >= statusSequence.length - 1) {
    return null;
  }
  return statusSequence[currentIndex + 1];
};

export const isStatusActionsComplete = (orderedParts: OrderedPart[], currentStatus: string): boolean => {
  const partsToCheck = orderedParts.filter(
    (part) => !(part.in_storage && part.approved_storage_withdrawal && part.qty === 0)
  );

  switch (currentStatus) {
    case "Pending":
      return orderedParts.every((part) => part.approved_pending_order === true);

    case "Order Sent To Head Office":
      return (
        (partsToCheck.length === 0 && orderedParts.length !== 0) ||
        partsToCheck.every((part) => part.approved_office_order === true)
      );

    case "Waiting For Quotation":
      return partsToCheck.every(
        (part) =>
          part.vendor !== null && part.unit_cost !== null && part.brand !== null
      );

    case "Budget Released":
      return partsToCheck.every(
        (part) =>
          part.approved_budget === true &&
          part.vendor !== null &&
          part.unit_cost !== null &&
          part.brand !== null
      );

    case "Waiting For Purchase":
      return partsToCheck.every(
        (part) =>
          part.part_purchased_date !== null &&
          part.vendor !== null &&
          part.unit_cost !== null &&
          part.brand !== null
      );

    case "Purchase Complete":
      return partsToCheck.every((part) => part.part_sent_by_office_date !== null);

    case "Parts Sent To Factory":
      return orderedParts.every(
        (part) =>
          part.part_received_by_factory_date !== null
      );
    case "Parts Received":
      return true;
    
    case "Transferred To Machine":
      return true;
    
    case "Transferred To Storage":
      return true;  

    default:
      return false;
  }
};


export const isChangeStatusAllowed = (ordered_parts: OrderedPart[], current_status: string) => {
  // Filter parts that have in_storage === false and approved_storage_withdrawal === false
  const partsToCheck = ordered_parts.filter(part =>!(part.in_storage && part.approved_storage_withdrawal && part.qty===0));
  // If there are no parts to check (i.e., all parts are either in storage or have approved storage withdrawal), allow the change
  
  
  switch (current_status) {
      case "Pending": {
        if (ordered_parts.every(part => part.approved_pending_order === true)) return 2
        break;
      }
      case "Order Sent To Head Office": {
        if (partsToCheck.length === 0 && ordered_parts.length!==0) return 8;  
        if (partsToCheck.every(part => part.approved_office_order === true)) return 3
        break;
      }
      case "Waiting For Quotation": {
        if (partsToCheck.every(part => part.vendor !== null && part.unit_cost !== null && part.brand !== null)) return 4
        break;
      }
      case "Budget Released": {
        if(partsToCheck.every(part => part.approved_budget === true && part.vendor !== null && part.unit_cost !== null && part.brand !== null)) return 5
        break;
      }
      case "Waiting For Purchase": {
        if(partsToCheck.every(part => part.part_purchased_date !== null)) return 6;
        break;
      }
      case "Purchase Complete": { 
        if(partsToCheck.every(part => part.part_sent_by_office_date !== null)) return 7
        break;
      }
      case "Parts Sent To Factory": {
        if(ordered_parts.every(part => part.part_received_by_factory_date !== null && part.mrr_number !== null)) return 8
        break;
      }

      default:
        return -1; 
    }
};

export const managePermission = (status: string, role: string): boolean => {
    switch (status) {
      case "Pending":
        if (role === "admin") {
          return true;
        } else if (role === "directorTechnical") {
          return true;
        } else if (role === "department") {
          return true;
        } else if (role === "finance") {
          return true;
        } 
        break;
  
      case "Order Sent To Head Office":
        if (role === "admin") {
          return true;
        }
        break;
  
      case "Waiting For Quotation":
        if (role === "finance") {
          return true;
        } else if (role === "admin") {
          return true;
        }
        break;
  
      case "Budget Released":
        if (role === "admin") {
          return true;
        } 
        break;
  
      case "Waiting For Purchase":
        if (role === "admin") {
          return true;
        } else if (role === "finance") {
          return true;
        }
        break;
  
      case "Purchase Complete":
        if (role === "admin") {
          return true;
        } else if (role === "finance") {
          return true;
        } 
        break;
  
      case "Parts Sent To Factory":
        if (role === "admin") {
          return true;
        } else if (role === "department") {
          return true;
        } else if (role === "directorTechnical") {
          return true;
        } else if (role === "finance") {
        return true;
        }
        break;
  
      case "Parts Received":
        if (role === "admin") {
          return true;
        } else if (role === "department") {
          return true;
        } else if (role === "directorTechnical") {
          return true;
        } else if (role === "finance") {
        return true;
        }
        break;
      
      case "Transferred To Machine":
        return true;
      
      default:
        return false;
    }
  
    return false;
  };


  export const isManagebleOrder = (status: string, role: string): boolean => {
    switch (status) {
      case "Pending":
         if (role === "directorTechnical") {
          return true;
        }
        break;
  
      case "Order Sent To Head Office":
        if (role === "admin") {
          return true;
        }
        break;
  
      case "Waiting For Quotation":
        if (role === "finance") {
          return true;
        } 
        break;
  
      case "Budget Released":
        if (role === "admin") {
          return true;
        } 
        break;
  
      case "Waiting For Purchase":
        if (role === "finance") {
          return true;
        }
        break;
  
      case "Purchase Complete":
        if (role === "finance") {
          return true;
        } 
        break;
  
      case "Parts Sent To Factory":
        if (role === "admin") {
          return true;
        } else if (role === "department") {
          return true;
        } else if (role === "directorTechnical") {
          return true;
        } else if (role === "finance") {
        return true;
        }
        break;
  
      case "Parts Received":
        return false
      
      case "Transferred To Machine":
        return false;


      default:
        return false;
    }
  
    return false;
  };

export function isFeatureSettingEnabled(
  app_settings: ApplicationSettings[]| null,
  setting_name: string
): boolean {
  return (
    app_settings?.some(s => s.name === setting_name && s.enabled === true) ?? false
  );
}


export function calculatePartAveragePrice(
  current_qty: number,
  current_avg_price: number, 
  added_qty: number, 
  added_avg_price: number): number 
{

  return (((current_qty * current_avg_price) + (added_qty * added_avg_price))/ (current_qty + added_qty))

}
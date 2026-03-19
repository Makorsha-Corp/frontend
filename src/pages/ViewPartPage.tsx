import LinkedOrdersTable from "@/components/customui/LinkedOrdersTable";
import NavigationBar from "@/components/customui/NavigationBar";
import PartInfo from "@/components/customui/PartInfo";
import { Button } from "@/components/ui/button";
import { convertUtcToBDTime } from "@/services/helper";
import { fetchOrderedPartByPartID } from "@/services/OrderedPartsService";
import { fetchPartByID } from "@/services/PartsService";
import { OrderedPart, Part } from "@/types";
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";

const ViewPartPage = () => {
  const { id } = useParams<{ id: string }>();
  const [part, setPart] = useState<Part | null>(null);
  const [linkedOrderedParts, setLinkedOrderedParts] = useState<OrderedPart[]>([]);
  const [loadingPartInfo, setLoadingPartInfo] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [sortField, setSortField] = useState<'id' | 'name' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const navigate = useNavigate();
  

  useEffect(() => {
    const loadParts = async () => {
      if (!id || isNaN(parseInt(id))) {
        toast.error("Invalid part ID");
        navigate("/parts");
        return;
      }
      const part_id = parseInt(id);
      try {
        const part_data = await fetchPartByID(part_id);
        if (part_data) {
          setPart(part_data);
        } else {
          toast.error("Part not found");
          navigate("/parts");
        }

      } catch (error) {
        toast.error("Failed to fetch Part info");
        navigate("/parts");
      } finally {
        setLoadingPartInfo(false);
        setLoadingTable(false);
      }

      try {
        const linked_ordered_parts_data = await fetchOrderedPartByPartID(part_id);
        setLinkedOrderedParts(linked_ordered_parts_data);

      } catch (error) {
        toast.error("Failed to fetch linked orders");
      } finally {
        setLoadingPartInfo(false);
      }
    };
    loadParts();
  }, [id, navigate]);

  const handleSort = (field: 'id' | 'name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedLinkedOrderedParts = [...linkedOrderedParts].sort((a, b) => {
    if (!sortField) return 0;
    
    let valueA: string | number;
    let valueB: string | number;
    
    if (sortField === 'id') {
      valueA = a.id;
      valueB = b.id;
    } else if (sortField === 'name') {
      valueA = a.parts.name.toLowerCase();
      valueB = b.parts.name.toLowerCase();
    } else {
      return 0;
    }
    
    if (valueA < valueB) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const getSortIcon = (field: 'id' | 'name') => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  if (loadingPartInfo) {
    return (
      <div className='flex flex-row justify-center p-5'>
        <Loader2 className="animate-spin" />
        <span>loading...</span>
      </div>
    );
  }

  if (!part) {
    toast.error("No order found with this id");
    return <div>No order found</div>; // Handle the case where no orders are returned
  }

  return (
    <>
    <NavigationBar />
    <div className="flex min-h-screen w-full flex-col bg-muted/40 mt-2">
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0">
        <div>
          <PartInfo
            id={part.id}
            created_at={convertUtcToBDTime(part.created_at)}
            name={part.name}
            unit={part.unit}
            description={part.description} />
        </div>

        {loadingTable ? (
          <div className='animate-spin flex flex-row justify-center p-5'>
            <Loader2 />
          </div>
        ) : (
          <div>
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('id')}
                className="flex items-center gap-2"
              >
                Sort by ID
                {getSortIcon('id')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort('name')}
                className="flex items-center gap-2"
              >
                Sort by Name
                {getSortIcon('name')}
              </Button>
            </div>
            <LinkedOrdersTable
              linkedOrderedParts={sortedLinkedOrderedParts} />
          </div>
        )}
      </main>
      <div className="flex justify-end">
        <div className="my-3 mx-3">
          <Link to={'/parts'}><Button>Back To Parts</Button></Link>
        </div>
      </div>
    </div></>
  );
};

export default ViewPartPage;

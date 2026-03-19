import ToggleBarChart from "@/components/customui/ToggleBarChart";
import NavigationBar from "@/components/customui/NavigationBar"
import { useAuth } from '@/context/AuthContext'; 
import { fetchMetricNotRunningMachines, fetchMetricRunningMachines } from "@/services/MachineServices";
import { fetchMetricMostFrequentOrderedParts, fetchMetricMostFrequentOrderedPartsCurrentMonth } from "@/services/OrderedPartsService";
import { fetchManagableOrders, fetchMetricActiveOrders, fetchMetricsHighMaintenanceFactorySections, fetchMetricsHighMaintenanceFactorySectionsCurrentMonth } from "@/services/OrdersService";
import {  Part } from "@/types";
import { useEffect, useState } from "react";
import {  useNavigate } from "react-router-dom";
import MachineStatusRadialChart from "@/components/customui/MachineStatusRadialChart";
import OrderStatusRadialChart from "@/components/customui/OrderStatusRadialChart";
import BusinessLensDisplayCard from "@/components/customui/BusinessLensDisplayCard";
const HomePage = () => {
  const profile = useAuth().profile
  const navigate = useNavigate();
  const [loadingMetricRunningMachines, setLoadingMetricRunningMachines] = useState<boolean>(false)
  const [loadingMetricNotRunningMachines, setLoadingMetricNotRunningMachines] = useState<boolean>(false)
  const [loadingMetricManagableOrders, setLoadingMetricManagableOrders] = useState<boolean>(false)
  const [loadingMetricActiveOrders, setLoadingMetricActiveOrders] = useState<boolean>(false)
  const [loadingMetricMostFrequentOrderedParts, setLoadingMetricMostFrequentOrderedParts] = useState<boolean>(false)
  const [loadingMetricMostFrequentOrderedPartsCurrentMonth, setLoadingMetricMostFrequentOrderedPartsCurrentMonth] = useState<boolean>(false)
  const [loadingMetricHighMaintenanceFactorySections, setLoadingMetricHighMaintenanceFactorySections] = useState<boolean>(false)
  const [loadingMetricHighMaintenanceFactorySectionsCurrentMonth, setLoadingMetricHighMaintenanceFactorySectionsCurrentMonth] = useState<boolean>(false)
  
  const [numberOfMachinesRunning, setNumberOfMachinesRunning] = useState<number|null>(null)
  const [numberOfMachinesNotRunning, setNumberOfMachinesNotRunning] = useState<number|null>(null)
  const [numberOfManagableOrders, setNumberOfManagableOrders] = useState<number|null>(null)
  const [numberOfActiveOrders, setNumberOfActiveOrders] = useState<number|null>(null)
  const [mostFrequentOrderedParts, setMostFrequentOrderedParts] = useState<{ part: Part; order_count: number }[] | null>(null);
  const [mostFrequentOrderedPartsCurrentMonth, setMostFrequentOrderedPartsCurrentMonth] = useState<{ part: Part; order_count: number }[] | null>(null);
  const [highMaintenanceFactorySections, setHighMaintenanceFactorySections] = useState<{ section: string; order_count: number }[] | null>(null);
  const [highMaintenanceFactorySectionsCurrentMonth, setHighMaintenanceFactorySectionsCurrentMonth] = useState<{ section: string; order_count: number }[] | null>(null)

  const loadMetricRunningMachines = async () => {
    setLoadingMetricRunningMachines(true);
    try {
      const runningMachines = await fetchMetricRunningMachines()
      setNumberOfMachinesRunning(runningMachines);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMetricRunningMachines(false);
    }
  };


  const loadMetricNotRunningMachines = async () => {
    setLoadingMetricNotRunningMachines(true);
    try {
      const notRunningMachines = await fetchMetricNotRunningMachines()
      setNumberOfMachinesNotRunning(notRunningMachines);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMetricNotRunningMachines(false);
    }
  };

  const loadMetricManagableOrders = async () => {
    setLoadingMetricManagableOrders(true);
    try {
      if (profile)
      { 
        const managableOrders = await fetchManagableOrders(profile.permission)
        setNumberOfManagableOrders(managableOrders);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMetricManagableOrders(false);
    }
  };

  const loadMetricActiveOrders = async () => {
    setLoadingMetricActiveOrders(true);
    try {
      const runningOrders = await fetchMetricActiveOrders()
      setNumberOfActiveOrders(runningOrders);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMetricActiveOrders(false);
    }
  };

  const loadMetricMostFrequentOrderedParts =  async () => {
    setLoadingMetricMostFrequentOrderedParts(true)
    try {
      //Reads the most frequent ordered parts from the data base and their counts
      const data = await fetchMetricMostFrequentOrderedParts()
      setMostFrequentOrderedParts(data)
    } catch (error) {
      console.log(error)
    } finally {
      setLoadingMetricMostFrequentOrderedParts(false)
    }
  }

  const loadMetricMostFrequentOrderedPartsCurrentMonth =  async () => {
    setLoadingMetricMostFrequentOrderedPartsCurrentMonth(true)
    try {
      //Reads the most frequent ordered parts from the data base and their counts for the current month
      const data = await fetchMetricMostFrequentOrderedPartsCurrentMonth()
      setMostFrequentOrderedPartsCurrentMonth(data)
    } catch (error) {
      console.log(error)
    } finally {
      setLoadingMetricMostFrequentOrderedPartsCurrentMonth(false)
    }
  }

  const loadMetricHighMaintenanceMachines = async () => {
    setLoadingMetricHighMaintenanceFactorySections(true)
    try {
      const data = await fetchMetricsHighMaintenanceFactorySections()
      setHighMaintenanceFactorySections(data)
    } catch (error) {
      console.log(error)
    } finally {
      setLoadingMetricHighMaintenanceFactorySections(false)
    }
  }

  const loadMetricHighMaintenanceMachinesCurrentMonth = async () => {
    setLoadingMetricHighMaintenanceFactorySectionsCurrentMonth(true)
    try {
      const data = await fetchMetricsHighMaintenanceFactorySectionsCurrentMonth()
      setHighMaintenanceFactorySectionsCurrentMonth(data)
    } catch (error) {
      console.log(error)
    } finally {
      setLoadingMetricHighMaintenanceFactorySectionsCurrentMonth(false)
    }
  }

  useEffect(()=>{
    loadMetricRunningMachines()
    loadMetricNotRunningMachines()
    loadMetricActiveOrders()
    loadMetricMostFrequentOrderedParts()
    loadMetricMostFrequentOrderedPartsCurrentMonth()
    loadMetricHighMaintenanceMachines()
    loadMetricHighMaintenanceMachinesCurrentMonth()
  },[])

  useEffect(() => {
    if (profile) {
      loadMetricManagableOrders();
    }
  }, [profile]); 

  console.log("High Maintenance Monthly", highMaintenanceFactorySectionsCurrentMonth);


  // const fakeHighMaintenanceFactorySections = [
  //   { section: "ACL - Warp Knitting", order_count: 999 },
  //   { section: "ACML - Carding", order_count: 2},
  //   { section: "ATML - Finishing", order_count: 4 },
  //   { section: "ACL - Spinning", order_count: 5 },
  //   { section: "ACML - Autoconer", order_count: 8 },
  //   { section: "ATML - Drawing", order_count: 0 },
  //   { section: "ACL - Combing", order_count: 3 },
  //   { section: "ACML - Packing", order_count: 4 },
  //   { section: "ACL - Ring Frame", order_count: 5 },
  //   { section: "ATML - Simplex", order_count: 3 },
  // ];


  return (
    <>
      <NavigationBar />
  
      {/* Main Page Container */}
      <div className="w-full px-4 mt-3 space-y-3 overflow-x-hidden overflow-y-hidden" id="homepage-container">

          {/* Chart Section - Most Frequent Parts */}
          <div className="w-full flex flex-row justify-center gap-4" id="top-chart-wrapper">
          <div className="w-1/2" id="alltime-frequent-chart-inner">
            {mostFrequentOrderedParts && mostFrequentOrderedPartsCurrentMonth && (
              <ToggleBarChart
                monthly={mostFrequentOrderedPartsCurrentMonth}
                allTime={mostFrequentOrderedParts}
                getName={(item) => item.part.name}
                title="Most Frequently Ordered Parts"
                description="View by this month or all-time"
                onLabelClick={(item) => {
                  window.open(`/viewpart/${item.part.id}`, '_blank');
                }}
            />              
            )}
          </div>
          <div className="w-1/2" id="monthly-frequent-chart-inner">
            {highMaintenanceFactorySections && highMaintenanceFactorySectionsCurrentMonth && (
                <ToggleBarChart
                  monthly={highMaintenanceFactorySectionsCurrentMonth}
                  allTime={highMaintenanceFactorySections}
                  getName={(item) => item.section}
                  title="High Maintenance Factory Sections"
                  description="Based on order frequency per factory section"
                  onLabelClick={(item) => {
                    window.open(`/management?card=factorySections`, '_blank');
                  }}
              />
              )}
          </div>
        </div>
        
         {/* Chart Section - Most Frequent Parts */}
         <div className="w-full flex flex-row justify-center gap-4" id="bottom-chart-wrapper">
          <div className="w-1/2" id="expenselens">
              <BusinessLensDisplayCard/>
          </div>
          <div className="w-1/2" id="machine-status-chart-inner">
              <MachineStatusRadialChart
              running={numberOfMachinesRunning ?? 0}
              notRunning={numberOfMachinesNotRunning ?? 0}
            />
          </div>

          <div className="w-1/2" id="machine-status-chart-inner">
              <MachineStatusRadialChart
              running={numberOfMachinesRunning ?? 0}
              notRunning={numberOfMachinesNotRunning ?? 0}
            />
          </div>
      

          <div className="w-1/2" id="order-status-chart-inner">
              <OrderStatusRadialChart
              totalOrders={numberOfActiveOrders ?? 0}
              manageableOrders={numberOfManagableOrders ?? 0}
            />
          </div>
          
        </div>
      



        

        


  
  
      </div>
    </>
  );
}
  

export default HomePage

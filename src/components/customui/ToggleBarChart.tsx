import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Part } from "@/types";
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"



const predefinedColors = [
  "#ff8b94", // rose (moved near magenta)
  "#ffaaa5", // coral (visually balances rose)
  "#ffd3b6", // peach
  "#fbe0ae", // warm yellow
  "#dcedc1", // yellow-green
  "#bcfbae", // light green
  "#a8e6cf", // mint / teal
  "#bbc0ff", // periwinkle / blue
  "#fbbee9", // pink-magenta
  "#f49fc2", // soft mid-pink
];

// Function to get a color from the predefined array
function getColor(index: number) {
  return predefinedColors[index % predefinedColors.length];
}

type ChartItem<T> = {
  monthly: T[];
  allTime: T[];
  getName: (item: T) => string;
  title: string;
  description: string;
  onLabelClick?: (item: T) => void;
};

export default function ToggleBarChart<T>({
  monthly,
  allTime,
  getName,
  title,
  description,
  onLabelClick,
}: ChartItem<T>) {
  const [view, setView] = useState<"monthly" | "all">("monthly");
  const selectedData = view === "monthly" ? monthly : allTime;

  const chartData = selectedData.map((item, index) => ({
    name: getName(item),
    orders: (item as any).order_count, // you could also pass a `getCount` fn
    fill: getColor(index),
    originalItem: item, // Store the original item for click handling
  }));

  const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-1))",
    },
    label: {
      color: "hsl(var(--background))",
    },
  };

  const handleLabelClick = (data: any) => {
    if (onLabelClick && data.originalItem) {
      onLabelClick(data.originalItem);
    }
  };

  return (
    <Card className="w-full max-w-full h-[520px]">
      <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4">
        <div className="flex-1 min-w-0">
          <CardTitle className="truncate">{title}</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            {description}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Label className="text-xs">Monthly</Label>
          <Switch
            id="view-toggle"
            checked={view === "all"}
            onCheckedChange={(checked) => setView(checked ? "all" : "monthly")}
          />
          <Label className="text-xs">All Time</Label>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 flex-1">
        <div className="w-full overflow-hidden h-full">
          <style>
            {`
              .clickable-label {
                cursor: pointer;
                transition: text-decoration 0.2s ease;
              }
              .clickable-label:hover {
                text-decoration: underline;
              }
            `}
          </style>
          <ChartContainer config={chartConfig} className="w-full h-[400px] min-h-[300px]">
            <BarChart 
              data={chartData} 
              layout="vertical" 
              margin={{ left: 0, right: 50, top: 10, bottom: 10 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={160}
                interval={0}
                tick={({ x, y, payload }) => {
                  const chartDataItem = chartData.find(item => item.name === payload.value);
                  const isClickable = onLabelClick && chartDataItem;
                  
                  return (
                    <text
                      x={x}
                      y={y}
                      dy={4}
                      textAnchor="end"
                      fill="#000000"
                      fontSize={12}
                      className={isClickable ? "clickable-label" : ""}
                      onClick={() => {
                        if (isClickable) {
                          handleLabelClick(chartDataItem);
                        }
                      }}
                    >
                      {payload.value.length > 20 ? payload.value.slice(0, 20) + "…" : payload.value}
                    </text>
                  );
                }}
              />
              <XAxis 
                dataKey="orders" 
                type="number" 
                tick={false} 
                axisLine={false} 
                tickMargin={8} 
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="bar" />} />
              <Bar dataKey="orders" radius={[4, 4, 4, 4]} maxBarSize={20}>
                <LabelList 
                  dataKey="orders" 
                  position="right" 
                  className="fill-foreground" 
                  fontSize={11} 
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}


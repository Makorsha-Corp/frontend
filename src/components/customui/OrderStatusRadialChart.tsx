"use client"

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"

type Props = {
  totalOrders: number
  manageableOrders: number
}

export default function OrderStatusRadialChart({
  totalOrders,
  manageableOrders,
}: Props) {
  const percentage = totalOrders === 0 ? 0 : (manageableOrders / totalOrders) * 100
  const chartData = [
    {
      name: "Manageable",
      value: percentage,
      fill: "hsl(var(--chart-1))",
    },
  ]

  const chartConfig: ChartConfig = {
    value: {
      label: "Manageable %",
    },
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-3">
        <CardTitle>Order Management</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] mb-5"
          style={{height : 189}}
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={270}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[83, 74]}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {manageableOrders}/{totalOrders}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Manageable
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

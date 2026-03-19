import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { LucideGlasses } from "lucide-react"
import { useNavigate } from "react-router-dom"


const BusinessLensDisplayCard = () => {
    const navigate = useNavigate()

    return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>BusinessLens</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <CardDescription className="my-5">
            Our reporting tool reveals where your money is going, uncovers inefficiencies, and helps you identify opportunities to save—so you can make confident decisions.
        </CardDescription>
        <div className="flex justify-center">
            <Button className='bg-cyan-600' onClick={()=>navigate(`/businesslens`)}>
                BusinessLens<LucideGlasses className='pl-2'></LucideGlasses>
            </Button>
        </div>

      </CardContent>
    </Card>
  )
}

export default BusinessLensDisplayCard
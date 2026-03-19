import { convertUtcToBDTime } from '@/services/helper';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

interface RelevantDatesInfoProp {
  part_purchased_date: string | null;
  part_received_by_factory_date: string | null;
  part_sent_by_office_date: string | null;
}

const RelevantDatesInfo: React.FC<RelevantDatesInfoProp> = ({
  part_purchased_date,
  part_received_by_factory_date,
  part_sent_by_office_date,
}) => {
  return (
    <Card className="sm:col-span-2" x-chunk="dashboard-05-chunk-0">
      <CardHeader className="pb-3">
        <CardTitle>Relevant Dates</CardTitle>
      </CardHeader>
      <Separator className="my-4" />
      <CardContent>
        <ul className="grid gap-3">
          <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground ">Part Purchased Date:</span>
            <span className= "whitespace-nowrap">{
            part_purchased_date? convertUtcToBDTime(part_purchased_date) : '-'
            }
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Part Sent By Office Date:</span>
            <span className= "whitespace-nowrap">
              {
                part_sent_by_office_date? convertUtcToBDTime(part_sent_by_office_date) : '-'
              }
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Part Received By Factory Date:</span>
            <span className= "whitespace-nowrap">
              {
                part_received_by_factory_date? convertUtcToBDTime(part_received_by_factory_date) : '-'
              }
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default RelevantDatesInfo;
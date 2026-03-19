import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { convertUtcToBDTime } from '@/services/helper';
import { OrderedPart } from '@/types';

interface OrderedPartInfoProp {
  orderedPart: OrderedPart;
}

const OrderedPartInfo: React.FC<OrderedPartInfoProp> = ({ orderedPart }) => {
  const { hasFeatureAccess } = useAuth();
  const canSeeFinance = hasFeatureAccess("finance_visibility");
  
  return (
    <Card className="sm:col-span-2 pt-2 h-[50vh] overflow-y-scroll" x-chunk="dashboard-ordered-part-popup">
      <CardContent>
        <ul className="grid gap-3">
          <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Part</span>
            <span><a className="hover:underline" target="_blank" href={`/viewpart/${orderedPart.part_id}`}>{orderedPart.parts.name}</a></span>
          </li>
          <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Unit</span>
            <span>{orderedPart.parts.unit || '-'}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Quantity</span>
            <span>{orderedPart.qty || '-'}</span>
          </li>
          {canSeeFinance &&
            <li className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">Brand</span>
              <span>{orderedPart.brand || '-'}</span>
          </li>
          }
          {canSeeFinance &&
            <li className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">Vendor</span>
              <span>{orderedPart.vendor || '-'}</span>
          </li>
          }
          {
            canSeeFinance &&
            <li className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">Cost/Unit</span>
              <span>{orderedPart.unit_cost ? `BDT ${orderedPart.unit_cost}` : '-'}</span>
            </li>
          }

          <Separator className="my-2" />
          <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Sample Sent to Office</span>
            <span>{orderedPart.is_sample_sent_to_office}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Sample Received by Office</span>
            <span>{orderedPart.is_sample_received_by_office}</span>
          </li>
          <Separator className="my-2" />
          <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Part Purchased Date</span>
            <span>{orderedPart.part_purchased_date ? convertUtcToBDTime(orderedPart.part_purchased_date) : '-'}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Part Sent to Factory Date</span>
            <span>{orderedPart.part_sent_by_office_date ? convertUtcToBDTime(orderedPart.part_sent_by_office_date) : '-'}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Part Received by Factory</span>
            <span>{orderedPart.part_received_by_factory_date ? convertUtcToBDTime(orderedPart.part_received_by_factory_date) : '-'}</span>
          </li>
          <Separator className="my-2" />
            <span className="font-semibold text-muted-foreground">Note</span>
            <div>{orderedPart.note || '-'}</div>
          <Separator className="my-2" />
          {canSeeFinance && <span className="font-semibold text-muted-foreground">Office Note</span>}
          {canSeeFinance && <div>{orderedPart.note || '-'}</div>}

        </ul>
      </CardContent>
    </Card>
  );
};

export default OrderedPartInfo;

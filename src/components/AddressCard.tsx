import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { STATUS_OPTIONS, StatusType } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AddressCardProps {
  streetName: string;
  houseNumber: string;
  status: StatusType;
  onStatusChange: (status: StatusType) => void;
  visitedBy?: string | null;
}

export default function AddressCard({
  streetName,
  houseNumber,
  status,
  onStatusChange,
  visitedBy,
}: AddressCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-3 md:p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 md:text-base">
              {streetName} {houseNumber}
            </h3>
            {visitedBy && status !== "unvisited" && (
              <p className="mt-0.5 text-xs text-slate-500">
                {visitedBy}
              </p>
            )}
          </div>
          <div
            className={cn(
              "h-3 w-3 rounded-full md:h-4 md:w-4",
              status === "unvisited" && "bg-gray-400",
              status === "nicht_da" && "bg-orange-500",
              status === "kein_interesse" && "bg-red-500",
              status === "abschluss" && "bg-green-500"
            )}
          />
        </div>
        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
          {STATUS_OPTIONS.filter((s) => s.value !== "unvisited").map(
            (option) => (
              <Button
                key={option.value}
                size="sm"
                variant={status === option.value ? "default" : "outline"}
                onClick={() => onStatusChange(option.value as StatusType)}
                className={cn(
                  "text-[10px] md:text-xs",
                  status === option.value &&
                    option.value === "nicht_da" &&
                    "bg-orange-500 hover:bg-orange-600",
                  status === option.value &&
                    option.value === "kein_interesse" &&
                    "bg-red-500 hover:bg-red-600",
                  status === option.value &&
                    option.value === "abschluss" &&
                    "bg-green-500 hover:bg-green-600"
                )}
              >
                {option.label}
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
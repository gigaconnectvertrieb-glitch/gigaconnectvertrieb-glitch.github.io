import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import AddressCard from "./AddressCard";
import { Address } from "@/hooks/useAddresses";
import { StatusType } from "@/lib/utils";

interface StreetGroupProps {
  streetName: string;
  addresses: Address[];
  onStatusChange: (id: string, status: StatusType) => void;
}

export default function StreetGroup({
  streetName,
  addresses,
  onStatusChange,
}: StreetGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

  const stats = {
    total: addresses.length,
    visited: addresses.filter((a) => a.status !== "unvisited").length,
    abschluss: addresses.filter((a) => a.status === "abschluss").length,
    nichtDa: addresses.filter((a) => a.status === "nicht_da").length,
    keinInteresse: addresses.filter((a) => a.status === "kein_interesse").length,
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-3 md:p-4"
      >
        <div className="flex items-center gap-2 md:gap-3">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-slate-500 md:h-5 md:w-5" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500 md:h-5 md:w-5" />
          )}
          <h2 className="text-sm font-semibold text-slate-900 md:text-base">
            {streetName}
          </h2>
          <span className="text-xs text-slate-500 md:text-sm">
            {stats.visited}/{stats.total}
          </span>
        </div>
        <div className="flex gap-1.5">
          {stats.abschluss > 0 && (
            <span className="h-2 w-2 rounded-full bg-green-500 md:h-2.5 md:w-2.5" />
          )}
          {stats.nichtDa > 0 && (
            <span className="h-2 w-2 rounded-full bg-orange-500 md:h-2.5 md:w-2.5" />
          )}
          {stats.keinInteresse > 0 && (
            <span className="h-2 w-2 rounded-full bg-red-500 md:h-2.5 md:w-2.5" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 gap-2 border-t border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:p-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              streetName={address.street_name}
              houseNumber={address.house_number}
              status={address.status}
              visitedBy={address.visited_by}
              onStatusChange={(status) => onStatusChange(address.id, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
import { useMemo, useState } from "react";
import type { SchemeRecord } from "../types";

interface SchemeFinderProps {
  data: SchemeRecord[];
  onFilter: (query: { sector?: string; beneficiary_type?: string; ministry?: string }) => void;
}

export default function SchemeFinder({ data, onFilter }: SchemeFinderProps) {
  const [sector, setSector] = useState("");
  const [beneficiaryType, setBeneficiaryType] = useState("");
  const [ministry, setMinistry] = useState("");

  const sectors = useMemo(() => [...new Set(data.map((d) => d.sector).filter(Boolean))].sort(), [data]);
  const ministries = useMemo(() => [...new Set(data.map((d) => d.ministry).filter(Boolean))].sort(), [data]);

  return (
    <div className="card">
      <h2>Government Scheme Discovery</h2>
      <div className="filters">
        <select value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">All sectors</option>
          {sectors.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Beneficiary type"
          value={beneficiaryType}
          onChange={(e) => setBeneficiaryType(e.target.value)}
        />

        <select value={ministry} onChange={(e) => setMinistry(e.target.value)}>
          <option value="">All ministries</option>
          {ministries.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          onClick={() =>
            onFilter({
              sector: sector || undefined,
              beneficiary_type: beneficiaryType || undefined,
              ministry: ministry || undefined
            })
          }
        >
          Apply Filters
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Scheme</th>
              <th>Ministry</th>
              <th>Sector</th>
              <th>Benefits</th>
              <th>Eligibility</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((scheme, index) => (
              <tr key={`${scheme.scheme_name}-${index}`}>
                <td>{scheme.scheme_name}</td>
                <td>{scheme.ministry}</td>
                <td>{scheme.sector}</td>
                <td>{scheme.benefits || "NA"}</td>
                <td>{scheme.eligibility || "NA"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
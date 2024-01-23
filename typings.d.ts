interface job {
    absolute_url?: string;
    data_compliance: Datacompliance[];
    internal_job_id: number;
    location: Location;
    metadata?: any;
    id: number;
    updated_at: string;
    requisition_id: string;
    title: string;
    content: string;
    departments: Department[];
    offices: Office[];
  }
  interface Office {
    id: number;
    name: string;
    location: string;
    child_ids: any[];
    parent_id?: any;
  }
  interface Department {
    id: number;
    name: string;
    child_ids: any[];
    parent_id?: any;
  }
  interface Location {
    name: string;
  }
  interface Datacompliance {
    type: string;
    requires_consent: boolean;
    requires_processing_consent: boolean;
    requires_retention_consent: boolean;
    retention_period: number;
  }
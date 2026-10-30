-- Migration: Update general_service_records_status_check to also accept 'Done'
ALTER TABLE public.general_service_records 
  DROP CONSTRAINT IF EXISTS general_service_records_status_check;

ALTER TABLE public.general_service_records 
  ADD CONSTRAINT general_service_records_status_check 
  CHECK (status IN ('Pending', 'In Process', 'Completed', 'Done', 'Rejected'));

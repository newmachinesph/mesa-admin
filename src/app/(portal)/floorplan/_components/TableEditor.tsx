'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Table, TableShape, Zone } from '@/core';
import { GhostButton, PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Modal, ConfirmDialog } from '@/components/ui/dialog';
import { Field, NumberStepper, TextInput } from '@/components/ui/field';
import { Option, Select } from '@/components/ui/select';
import { newTableId } from './floorplan-utils';

const SHAPES: Array<{ value: TableShape; label: string }> = [
  { value: 'round', label: 'Round' },
  { value: 'square', label: 'Square' },
  { value: 'rect', label: 'Rectangle' },
  { value: 'booth', label: 'Booth' },
];

interface TableEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: Table; // present = editing; absent = placing a new table
  cell?: { x: number; y: number }; // grid coords for a new table
  zones: Zone[];
  restaurantId: string;
  defaultZoneId: string;
  onSubmit: (table: Table) => void;
  onDelete: (id: string) => void;
}

// Popover editor for one table. Commits the whole table back to the caller,
// which folds it into the restaurant layout (store.updateLayout).
export function TableEditor({
  open,
  onOpenChange,
  table,
  cell,
  zones,
  restaurantId,
  defaultZoneId,
  onSubmit,
  onDelete,
}: TableEditorProps) {
  const [label, setLabel] = useState(table?.label ?? '');
  const [seats, setSeats] = useState(table?.seats ?? 2);
  const [minSeats, setMinSeats] = useState(table?.minSeats ?? 1);
  const [shape, setShape] = useState<TableShape>(table?.shape ?? 'square');
  const [zoneId, setZoneId] = useState(table?.zoneId ?? defaultZoneId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [touched, setTouched] = useState(false);

  const labelError = touched && label.trim() === '' ? 'Give the table a label' : undefined;

  const handleSubmit = () => {
    setTouched(true);
    if (label.trim() === '') return;
    const safeMin = Math.min(Math.max(1, minSeats), seats);
    onSubmit({
      id: table?.id ?? newTableId(restaurantId),
      label: label.trim(),
      seats,
      minSeats: safeMin,
      gridX: table?.gridX ?? cell?.x ?? 0,
      gridY: table?.gridY ?? cell?.y ?? 0,
      shape,
      zoneId,
      combinableWith: table?.combinableWith ?? [],
    });
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={table ? `Edit ${table.label}` : 'New table'}
      description={
        table
          ? 'Update seats, shape, or zone. Changes take effect immediately.'
          : `Placing at column ${(cell?.x ?? 0) + 1}, row ${(cell?.y ?? 0) + 1}.`
      }
      size="sm"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {table ? (
            <GhostButton
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="text-danger hover:bg-danger-bg hover:text-danger"
            >
              <Trash2 className="size-4" />
              Delete
            </GhostButton>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <SecondaryButton size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton size="sm" onClick={handleSubmit}>
              {table ? 'Save' : 'Add table'}
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Label" required error={labelError} htmlFor="tbl-label">
          <TextInput
            id="tbl-label"
            value={label}
            invalid={Boolean(labelError)}
            placeholder="e.g. T7"
            maxLength={6}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => setTouched(true)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Seats" htmlFor="tbl-seats">
            <NumberStepper
              id="tbl-seats"
              value={seats}
              min={1}
              max={20}
              onChange={(n) => {
                setSeats(n);
                if (minSeats > n) setMinSeats(n);
              }}
              suffix="max"
            />
          </Field>
          <Field label="Min seats" hint="Smallest party to seat here" htmlFor="tbl-min">
            <NumberStepper id="tbl-min" value={minSeats} min={1} max={seats} onChange={setMinSeats} suffix="min" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Shape" htmlFor="tbl-shape">
            <Select
              id="tbl-shape"
              value={shape}
              onValueChange={(v) => setShape(v as TableShape)}
              aria-label="Table shape"
            >
              {SHAPES.map((s) => (
                <Option key={s.value} value={s.value}>
                  {s.label}
                </Option>
              ))}
            </Select>
          </Field>
          <Field label="Zone" htmlFor="tbl-zone">
            <Select id="tbl-zone" value={zoneId} onValueChange={setZoneId} aria-label="Zone">
              {zones.map((z) => (
                <Option key={z.id} value={z.id}>
                  {z.name}
                </Option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {table && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete ${table.label}?`}
          description="This removes the table from the floor plan and any combinable links to it."
          confirmLabel="Delete table"
          destructive
          onConfirm={() => {
            onDelete(table.id);
            setConfirmDelete(false);
            onOpenChange(false);
          }}
        />
      )}
    </Modal>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Unit, unitApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import UnitForm from '@/components/UnitForm';
import { toast } from 'sonner';

const UnitManagement = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // Fetch units
  const { data: units, isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const response = await unitApi.getAll();
      return response.data;
    }
  });

  // Create unit mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; abbreviation: string }) => {
      return await unitApi.create(data.name, data.abbreviation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setIsFormOpen(false);
      toast.success('Unit created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create unit');
    }
  });

  // Update unit mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; abbreviation: string } }) => {
      return await unitApi.update(id, data.name, data.abbreviation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setIsFormOpen(false);
      toast.success('Unit updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update unit');
    }
  });

  const handleCreate = () => {
    setFormMode('create');
    setSelectedUnit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (unit: Unit) => {
    setFormMode('edit');
    setSelectedUnit(unit);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: { name: string; abbreviation: string }) => {
    if (formMode === 'create') {
      createMutation.mutate(data);
    } else if (formMode === 'edit' && selectedUnit) {
      updateMutation.mutate({ id: selectedUnit.id, data });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Unit Management</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abbreviation</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {units?.map((unit) => (
              <tr key={unit.id}>
                <td className="px-6 py-4 whitespace-nowrap">{unit.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{unit.abbreviation}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(unit)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UnitForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        unit={selectedUnit || undefined}
        mode={formMode}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default UnitManagement; 
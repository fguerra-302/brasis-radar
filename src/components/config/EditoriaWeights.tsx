import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEditorialWeights, useUpsertEditorialWeight, useDeleteEditorialWeight } from '@/hooks/useEditorialWeights';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
import { defaultEditorialWeights, type EditoriaWeightUI } from '@/constants/defaultEditorialWeights';
import { RelevanceThresholdConfig } from './RelevanceThresholdConfig';
import { EditorialWeightCard } from './EditorialWeightCard';
import { AddEditoriaForm } from './AddEditoriaForm';


export const EditoriaWeights = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Backend data
  const { data: editorialWeights, isLoading } = useEditorialWeights();
  const { data: userSettings } = useUserSettings();
  const upsertWeight = useUpsertEditorialWeight();
  const deleteWeight = useDeleteEditorialWeight();
  const updateUserSettings = useUpdateUserSettings();
  
  // UI state
  const [weights, setWeights] = useState<EditoriaWeightUI[]>([]);
  const [minThreshold, setMinThreshold] = useState(3);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Sync backend data with UI state
  useEffect(() => {
    if (editorialWeights) {
      // Convert backend data to UI format
      const uiWeights: EditoriaWeightUI[] = editorialWeights.map(weight => ({
        id: weight.id,
        name: weight.editoria,
        color: defaultEditorialWeights.find(dw => dw.name === weight.editoria)?.color || 'bg-gray-500',
        multiplier: Number(weight.multiplier),
        description: getDescriptionForEditoria(weight.editoria)
      }));
      
      // Add any missing default weights
      const existingEditorias = uiWeights.map(w => w.name);
      const missingDefaults = defaultEditorialWeights.filter(dw => !existingEditorias.includes(dw.name));
      
      setWeights([...uiWeights, ...missingDefaults]);
    } else if (!isLoading) {
      setWeights(defaultEditorialWeights);
    }
  }, [editorialWeights, isLoading]);
  
  // Sync threshold from user settings
  useEffect(() => {
    if (userSettings?.min_relevance_threshold) {
      setMinThreshold(userSettings.min_relevance_threshold);
    }
  }, [userSettings]);
  
  const getDescriptionForEditoria = (editoria: string): string => {
    const defaultWeight = defaultEditorialWeights.find(dw => dw.name === editoria);
    return defaultWeight?.description || 'Categoria personalizada';
  };

  const updateWeight = (index: number, newMultiplier: number) => {
    const updatedWeights = [...weights];
    updatedWeights[index].multiplier = newMultiplier;
    setWeights(updatedWeights);
    setHasChanges(true);
  };

  const addEditoria = (newEditoriaObj: EditoriaWeightUI) => {
    setWeights([...weights, newEditoriaObj]);
    setHasChanges(true);
  };

  const removeEditoria = async (index: number) => {
    const weight = weights[index];
    
    if (weight.id) {
      // Delete from backend
      try {
        await deleteWeight.mutateAsync(weight.id);
      } catch (error) {
        return; // Error already shown by hook
      }
    }
    
    // Remove from UI
    const updatedWeights = weights.filter((_, i) => i !== index);
    setWeights(updatedWeights);
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setWeights(defaultEditorialWeights);
    setMinThreshold(3);
    setHasChanges(true);
    toast({
      title: "Configurações restauradas",
      description: "Os multiplicadores e threshold foram restaurados para os valores padrão.",
    });
  };

  const saveWeights = async () => {
    try {
      // Save editorial weights
      for (const weight of weights) {
        await upsertWeight.mutateAsync({
          editoria: weight.name,
          multiplier: weight.multiplier
        });
      }
      
      // Update min threshold in user settings
      if (userSettings?.id) {
        await updateUserSettings.mutateAsync({
          id: userSettings.id,
          payload: { min_relevance_threshold: minThreshold }
        });
      }
      
      toast({
        title: "✅ Configurações salvas",
        description: "Os multiplicadores editoriais e threshold foram atualizados com sucesso.",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Falha ao salvar as configurações.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Multiplicadores por Editoria</h1>
            <p className="text-slate-600 mt-1">
              Configure os multiplicadores que cada editoria terá no cálculo de relevância
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={resetToDefaults} className="flex items-center gap-2">
          Restaurar Padrões
        </Button>
      </div>

      {/* Threshold Configuration */}
      <RelevanceThresholdConfig
        threshold={minThreshold}
        onChange={(value) => {
          setMinThreshold(value);
          setHasChanges(true);
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {weights.map((editoria, index) => (
          <EditorialWeightCard
            key={editoria.id || editoria.name}
            editoria={editoria}
            index={index}
            onUpdateWeight={updateWeight}
            onRemove={removeEditoria}
          />
        ))}
      </div>

      <AddEditoriaForm weights={weights} onAdd={addEditoria} />

      {hasChanges && (
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setHasChanges(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={saveWeights} 
            disabled={upsertWeight.isPending || updateUserSettings.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {(upsertWeight.isPending || updateUserSettings.isPending) ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      )}
    </div>
  );
};
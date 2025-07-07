import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export const BackButton = ({ to = '/', label = 'Voltar', className }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleClick}
      className={`flex items-center gap-2 ${className || ''}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
};
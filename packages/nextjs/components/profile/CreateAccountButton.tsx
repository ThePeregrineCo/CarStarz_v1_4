"use client";

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { CreateAccountModal } from './CreateAccountModal';

interface CreateAccountButtonProps {
  className?: string;
  buttonText?: string;
  onSuccess?: () => void;
}

export const CreateAccountButton: React.FC<CreateAccountButtonProps> = ({ 
  className = "px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600",
  buttonText = "Create Account",
  onSuccess 
}) => {
  const { address } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <>
      <button
        onClick={handleOpenModal}
        className={className}
        disabled={!address}
      >
        {buttonText}
      </button>
      
      <CreateAccountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </>
  );
};
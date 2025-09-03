
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import RadarBrasis from '@/components/RadarBrasis';

const Index = () => {
  console.log('Index component rendering');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect authenticated users to curadoria
  useEffect(() => {
    if (user) {
      console.log('User authenticated, redirecting to curadoria');
      navigate('/curadoria', { replace: true });
    }
  }, [user, navigate]);
  
  return (
    <div className="min-h-screen">
      <RadarBrasis />
    </div>
  );
};

export default Index;

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Administration = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/admin/organizations');
  }, [navigate]);
  return null;
};

export default Administration; 
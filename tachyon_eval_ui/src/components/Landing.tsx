import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Container,
  Alert,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

// Use case ID format validation
const validateUseCaseIdFormat = (id: string): boolean => {
  // Use case ID should be alphanumeric and can contain underscores
  const useCaseIdRegex = /^[a-zA-Z0-9_]+$/;
  return useCaseIdRegex.test(id);
};

const Landing: React.FC = () => {
  const [useCaseId, setUseCaseId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!useCaseId.trim()) {
      setError('Please enter a Use Case ID');
      return;
    }

    // First validate the format
    if (!validateUseCaseIdFormat(useCaseId)) {
      setError('Invalid Use Case ID format. Please use only letters, numbers, and underscores.');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await apiService.validateUseCaseId(useCaseId);
      if (isValid) {
        // Store the use case ID in localStorage
        localStorage.setItem('useCaseId', useCaseId);
        // Navigate to the main app
        navigate('/evaluate');
      } else {
        setError('Invalid Use Case ID. Please contact the application admin team for access.');
      }
    } catch (error) {
      setError('Failed to validate Use Case ID. Please try again later or contact the admin team if the issue persists.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ScienceIcon
              sx={{
                fontSize: 48,
                color: 'primary.main',
                mb: 1,
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 600,
                textAlign: 'center',
                color: 'text.primary',
              }}
            >
              Welcome to Tachyon Eval
            </Typography>
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                maxWidth: '80%',
              }}
            >
              Please enter your Use Case ID to continue
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Use Case ID"
              value={useCaseId}
              onChange={(e) => {
                setUseCaseId(e.target.value);
                setError(null);
              }}
              error={!!error}
              helperText={error}
              placeholder="Enter your Use Case ID"
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoading}
              sx={{
                mt: 2,
                py: 1.5,
                fontSize: '1rem',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s',
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Continue'
              )}
            </Button>
          </Box>

          <Typography
            variant="caption"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              mt: 2,
            }}
          >
            Your Use Case ID will be stored locally for this session
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Landing; 
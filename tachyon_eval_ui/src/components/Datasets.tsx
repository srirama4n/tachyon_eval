import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Stack,
  Card,
  CardContent,
  Tooltip,
  Fade,
  Zoom,
  LinearProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StorageIcon from '@mui/icons-material/Storage';
import InfoIcon from '@mui/icons-material/Info';
import { apiService } from '../services/api';

interface Dataset {
  id: string;
  alias: string;
  created_at: string;
  numGoldens: number;
}

const Datasets: React.FC = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newDataset, setNewDataset] = useState({ alias: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getDatasets();
      setDatasets(data);
    } catch (error) {
      setError('Failed to fetch datasets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewDataset({ alias: '' });
  };

  const handleCreateDataset = async () => {
    if (!newDataset.alias) {
      setError('Alias is required');
      return;
    }

    try {
      await apiService.createDataset(newDataset.alias);
      handleCloseDialog();
      fetchDatasets();
    } catch (error) {
      setError('Failed to create dataset');
    }
  };

  const handleDeleteDataset = async (id: string) => {
    try {
      await apiService.deleteDataset(id);
      fetchDatasets();
    } catch (error) {
      setError('Failed to delete dataset');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto' }}>
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 3,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <Box 
          sx={{ 
            p: 3, 
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.default',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(45deg, #f5f7fa 0%, #e4e8eb 100%)'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '1.75rem',
                letterSpacing: '-0.5px',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              Datasets
            </Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s'
            }}
          >
            Create Dataset
          </Button>
        </Box>

        <Box sx={{ p: 4 }}>
          {datasets.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                gap: 4,
                textAlign: 'center'
              }}
            >
              <StorageIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
                No Datasets Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '400px' }}>
                Create your first dataset to start evaluating models
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                size="large"
                sx={{
                  px: 4,
                  py: 2,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                Create Dataset
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>Dataset Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>Created Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datasets.map((dataset) => (
                    <TableRow 
                      key={dataset.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          cursor: 'pointer'
                        },
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => navigate(`/datasets/${dataset.alias}`, { state: { datasetId: dataset.id } })}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {dataset.alias}
                          </Typography>
                          <Tooltip title="View dataset details">
                            <InfoIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </Tooltip>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(dataset.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit dataset">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle edit
                              }}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'primary.lighter'
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete dataset">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDataset(dataset.id);
                              }}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'error.lighter'
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            background: 'linear-gradient(45deg, #ffffff 0%, #f8f9fa 100%)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ 
              p: 1, 
              borderRadius: 2, 
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AddIcon sx={{ color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Create New Dataset
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Dataset Name"
              fullWidth
              value={newDataset.alias}
              onChange={(e) => setNewDataset({ alias: e.target.value })}
              required
              placeholder="Enter a descriptive name for your dataset"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                },
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, color: 'text.secondary' }}>
                    <StorageIcon />
                  </Box>
                ),
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This name will be used to identify your dataset across the platform.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateDataset}
            disabled={!newDataset.alias}
            startIcon={<AddIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              py: 1,
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s'
            }}
          >
            Create Dataset
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Fade in={!!error}>
          <Alert 
            severity="error" 
            sx={{ 
              mt: 4,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            {error}
          </Alert>
        </Fade>
      )}
    </Box>
  );
};

export default Datasets; 
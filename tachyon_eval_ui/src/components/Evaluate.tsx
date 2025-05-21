import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  Stack,
  IconButton,
  LinearProgress,
  Fade,
  Tooltip,
} from '@mui/material';
import { Grid } from '@mui/material';
import { apiService } from '../services/api';
import ScienceIcon from '@mui/icons-material/Science';
import DatasetIcon from '@mui/icons-material/Storage';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import type { GridProps } from '@mui/material/Grid';
import { alpha } from '@mui/material/styles';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltIcon from '@mui/icons-material/Bolt';
import ChatIcon from '@mui/icons-material/Chat';
import FolderIcon from '@mui/icons-material/Folder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Autocomplete from '@mui/material/Autocomplete';
import DownloadIcon from '@mui/icons-material/Download';

interface Dataset {
  id: string;
  alias: string;
  updated_at: string;
}

interface CustomParameter {
  key: string;
  value: string;
}

interface EvaluationHistory {
  id: string;
  name: string;
  dataset_id: string;
  dataset_name: string;
  temperature: string;
  model_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  start_time: string;
  end_time?: string;
  parameters: { name: string; value: string; }[];
  evaluation_name: string;
  usecase_id: string;
}

type SortField = 'status' | 'dataset_name' | 'model_id' | 'start_time' | 'duration' | 'evaluation_name';
type SortOrder = 'asc' | 'desc';

const Evaluate: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [evaluationName, setEvaluationName] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [customParameters, setCustomParameters] = useState<CustomParameter[]>([]);
  const [newParameter, setNewParameter] = useState<CustomParameter>({ key: '', value: '' });
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number>(1000);
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationHistory[]>([ ]);
  const [sortField, setSortField] = useState<SortField>('start_time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchDatasets();
        await fetchEvaluationHistory();
      } catch (error) {
        console.error('Failed to initialize data:', error);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (evaluationId) {
      intervalId = setInterval(async () => {
        try {
          const historys = await apiService.getEvaluationHistory();
          const history = historys.map(h => ({
            id: h.id,
            name: h.evaluation_name,
            dataset_id: h.dataset_id,
            dataset_name: datasets.find(d => d.id === h.dataset_id)?.alias || h.dataset_id,
            model_id: h.model_id,
            temperature: h.temperature,
            status: h.status as 'pending' | 'running' | 'completed' | 'failed',
            start_time: h.created_at,
            end_time: h.completed_at || h.failed_at,
            parameters: h.parameters,
            evaluation_name: h.evaluation_name,
            usecase_id: h.usecase_id,
          }));
          setEvaluationHistory(history);
        } catch (error) {
          console.error('Failed to fetch evaluation history:', error);
        }
      }, pollingInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [evaluationId, pollingInterval, datasets]);

  const fetchDatasets = async () => {
    try {
      const data = await apiService.getDatasets();
      setDatasets(data);
      await fetchEvaluationHistory();
    } catch (error) {
      setError('Failed to fetch datasets');
      throw error;
    }
  };

  const fetchEvaluationHistory = async () => {
    try {
      const historys = await apiService.getEvaluationHistory();
      const retrievedDatasets = await apiService.getDatasets();
      const history = historys.map(h => ({
        id: h.id,
        name: h.evaluation_name,
        dataset_id: h.dataset_id,
        dataset_name: retrievedDatasets.find(d => d.id === h.dataset_id)?.alias || h.dataset_id,
        model_id: h.model_id,
        temperature: h.temperature,
        status: h.status as 'pending' | 'running' | 'completed' | 'failed',
        start_time: h.created_at,
        end_time: h.completed_at || h.failed_at,
        parameters: h.parameters,
        evaluation_name: h.evaluation_name,
        usecase_id: h.usecase_id,
      }));
      setEvaluationHistory(history);
    } catch (error) {
      console.error('Failed to fetch evaluation history:', error);
    }
  };

  const handleAddParameter = () => {
    if (newParameter.key && newParameter.value) {
      setCustomParameters([...customParameters, newParameter]);
      setNewParameter({ key: '', value: '' });
    }
  };

  const handleRemoveParameter = (index: number) => {
    setCustomParameters(customParameters.filter((_, i) => i !== index));
  };

  const handleEvaluate = async () => {
    if (!selectedDataset || !selectedModel) {
      setError('Please select both dataset and model');
      return;
    }

    if (!evaluationName.trim()) {
      setError('Please enter an evaluation name');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.submitEvaluation({
        dataset_id: selectedDataset,
        model_id: selectedModel,
        temperature: temperature.toString(),
        evaluation_name: evaluationName,
        parameters: customParameters.map(param => ({
          name: param.key,
          value: param.value
        }))
      });
      
      const newEvaluation: EvaluationHistory = {
        id: response.id,
        name: response.evaluation_name,
        dataset_id: response.dataset_id,
        model_id: selectedModel,
        temperature: response.temperature,
        parameters: response.parameters,
        evaluation_name: response.evaluation_name,
        dataset_name: datasets.find(d => d.id === response.dataset_id)?.alias || response.dataset_id,
        status: 'running',
        start_time: response.created_at,
        usecase_id: response.usecase_id,
      };

      setEvaluationHistory(prev => [newEvaluation, ...prev]);
      setEvaluationId(response.id);
      setResults([]);
      setEvaluationName('');
    } catch (error) {
      setError('Failed to run evaluation');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: EvaluationHistory['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'primary';
      default:
        return 'info';
    }
  };

  const getStatusIcon = (status: EvaluationHistory['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
        return <PlayCircleIcon color="primary" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedHistory = () => {
    return [...evaluationHistory].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'dataset_name':
          comparison = a.dataset_name.localeCompare(b.dataset_name);
          break;
        case 'model_id':
          comparison = a.model_id.localeCompare(b.model_id);
          break;
        case 'start_time':
          comparison = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
          break;
        case 'duration':
          const durationA = a.end_time 
            ? new Date(a.end_time).getTime() - new Date(a.start_time).getTime()
            : 0;
          const durationB = b.end_time 
            ? new Date(b.end_time).getTime() - new Date(b.start_time).getTime()
            : 0;
          comparison = durationA - durationB;
          break;
        case 'evaluation_name':
          comparison = a.evaluation_name.localeCompare(b.evaluation_name);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return null;
    return sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
  };

  const handleDownload = async (evaluationId: string, usecaseId: string) => {
    try {
      const response = await apiService.getEvaluationResponses(usecaseId, evaluationId);
      
      const tableHtml = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .success { color: #2e7d32; }
              .failure { color: #d32f2f; }
              .header { margin-bottom: 20px; }
              .header h2 { color: #1976d2; margin: 0; }
              .header p { color: #666; margin: 5px 0; }
              .metrics { margin-top: 10px; }
              .metrics strong { color: #1976d2; }
              .metrics small { color: #666; display: block; margin-top: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${response.evaluation_name}</h2>
            </div>

            <table>
              <tr>
                <th>Input</th>
                <th>Actual Output</th>
                <th>Expected Output</th>
                <th>Success</th>
                <th>Metrics</th>
              </tr>
              <tr>
                <td>${response.data.input}</td>
                <td>${response.data.actualoutput}</td>
                <td>${response.data.expectedOutput || 'N/A'}</td>
                <td class="${response.data.success ? 'success' : 'failure'}">
                  ${response.data.success ? '✓ Success' : '✗ Failed'}
                </td>
                <td>
                  ${response.data.metricsData.map(metric => `
                    <div class="metrics">
                      <strong>${metric.name}:</strong> ${(metric.score * 100).toFixed(1)}%
                      (${metric.success ? '✓' : '✗'})
                      <small>${metric.reason}</small>
                    </div>
                  `).join('')}
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      const blob = new Blob([tableHtml], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${response.evaluation_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading evaluation results:', error);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: '1400px', mx: 'auto' }}>
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
            p: 2, 
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'linear-gradient(45deg, #f5f7fa 0%, #e4e8eb 100%)'
          }}
        >
          <ScienceIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              fontSize: '1.5rem',
              letterSpacing: '-0.5px',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            Model Evaluation
          </Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }} component="div">
              <Card 
                elevation={0} 
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  height: '100%',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                    <DatasetIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>Dataset Selection</Typography>
                  </Stack>
                  <FormControl fullWidth>
                    <InputLabel>Dataset</InputLabel>
                    <Select
                      value={selectedDataset}
                      label="Dataset"
                      onChange={(e) => setSelectedDataset(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'divider'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        },
                        '& .MuiSelect-select': {
                          py: 1.5
                        }
                      }}
                    >
                      {datasets.map((dataset) => (
                        <MenuItem 
                          key={dataset.id} 
                          value={dataset.id}
                          sx={{
                            py: 1.5,
                            '&:hover': {
                              backgroundColor: alpha('#1976d2', 0.08)
                            }
                          }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1.5,
                            width: '100%'
                          }}>
                            <FolderIcon sx={{ color: 'primary.main' }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {dataset.alias}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Dataset ID: {dataset.id}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(dataset.updated_at).toLocaleDateString()}
                              </Typography>
                            </Stack>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }} component="div">
              <Card 
                elevation={0} 
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  height: '100%',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                    <ModelTrainingIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>Model Selection</Typography>
                  </Stack>
                  <FormControl fullWidth>
                    <InputLabel>Model</InputLabel>
                    <Select
                      value={selectedModel}
                      label="Model"
                      onChange={(e) => setSelectedModel(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'divider'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        },
                        '& .MuiSelect-select': {
                          py: 1.5
                        }
                      }}
                    >
                      <MenuItem 
                        value="gemini_pro_2_0"
                        sx={{
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: alpha('#1976d2', 0.08)
                          }
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1.5,
                          width: '100%'
                        }}>
                          <AutoAwesomeIcon sx={{ color: 'primary.main' }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              Gemini Pro 2.0
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Most capable model for complex tasks
                            </Typography>
                          </Box>
                          <Chip 
                            label="Latest" 
                            size="small" 
                            color="primary" 
                            sx={{ 
                              backgroundColor: alpha('#1976d2', 0.1),
                              fontWeight: 500
                            }} 
                          />
                        </Box>
                      </MenuItem>
                      <MenuItem 
                        value="gemini_flash_2_0"
                        sx={{
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: alpha('#1976d2', 0.08)
                          }
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1.5,
                          width: '100%'
                        }}>
                          <BoltIcon sx={{ color: 'warning.main' }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              Gemini Flash 2.0
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Fast and efficient for quick responses
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                      <MenuItem 
                        value="google_dialog_flow"
                        sx={{
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: alpha('#1976d2', 0.08)
                          }
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1.5,
                          width: '100%'
                        }}>
                          <ChatIcon sx={{ color: 'success.main' }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              Google Dialog Flow
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Specialized in conversational AI
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }} component="div">
              <Card 
                elevation={0} 
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                    <TuneIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>Parameters</Typography>
                  </Stack>
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }} component="div">
                      <Autocomplete
                        freeSolo
                        options={[
                          `${datasets.find(d => d.id === selectedDataset)?.alias || 'Dataset'} - ${selectedModel === 'gemini_pro_2_0' ? 'Gemini Pro 2.0' : 
                            selectedModel === 'gemini_flash_2_0' ? 'Gemini Flash 2.0' : 
                            selectedModel === 'google_dialog_flow' ? 'Dialog Flow' : 'Model'} Analysis`,
                          `${datasets.find(d => d.id === selectedDataset)?.alias || 'Dataset'} - ${selectedModel === 'gemini_pro_2_0' ? 'Gemini Pro 2.0' : 
                            selectedModel === 'gemini_flash_2_0' ? 'Gemini Flash 2.0' : 
                            selectedModel === 'google_dialog_flow' ? 'Dialog Flow' : 'Model'} Evaluation`,
                          `${datasets.find(d => d.id === selectedDataset)?.alias || 'Dataset'} - ${selectedModel === 'gemini_pro_2_0' ? 'Gemini Pro 2.0' : 
                            selectedModel === 'gemini_flash_2_0' ? 'Gemini Flash 2.0' : 
                            selectedModel === 'google_dialog_flow' ? 'Dialog Flow' : 'Model'} Test Run`,
                          `${datasets.find(d => d.id === selectedDataset)?.alias || 'Dataset'} - ${selectedModel === 'gemini_pro_2_0' ? 'Gemini Pro 2.0' : 
                            selectedModel === 'gemini_flash_2_0' ? 'Gemini Flash 2.0' : 
                            selectedModel === 'google_dialog_flow' ? 'Dialog Flow' : 'Model'} Performance Test`
                        ]}
                        value={evaluationName}
                        onChange={(_, newValue) => setEvaluationName(newValue || '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            label="Evaluation Name"
                            placeholder="Enter a name for this evaluation"
                            helperText="Choose a suggested name or enter your own"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: 'primary.main',
                                },
                              },
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1">{option}</Typography>
                            </Box>
                          </li>
                        )}
                        sx={{
                          '& .MuiAutocomplete-popupIndicator': {
                            color: 'primary.main'
                          },
                          '& .MuiAutocomplete-clearIndicator': {
                            color: 'primary.main'
                          }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }} component="div">
                      <TextField
                        fullWidth
                        label="Temperature"
                        type="number"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        inputProps={{ min: 0, max: 1, step: 0.1 }}
                        helperText="Controls randomness (0-1)"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 4 }} />
                  
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                    Custom Parameters
                  </Typography>
                  
                  <Stack spacing={3}>
                    {customParameters.map((param, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'flex', 
                          gap: 2, 
                          alignItems: 'center',
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: 'background.default',
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                      >
                        <TextField
                          label="Parameter Key"
                          value={param.key}
                          disabled
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          label="Parameter Value"
                          value={param.value}
                          disabled
                          sx={{ flex: 1 }}
                        />
                        <IconButton 
                          onClick={() => handleRemoveParameter(index)}
                          color="error"
                          size="small"
                          sx={{
                            '&:hover': {
                              backgroundColor: 'error.lighter'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 2,
                        border: '1px dashed',
                        borderColor: 'divider',
                        backgroundColor: 'background.default'
                      }}
                    >
                      <TextField
                        label="Parameter Key"
                        value={newParameter.key}
                        onChange={(e) => setNewParameter({ ...newParameter, key: e.target.value })}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Parameter Value"
                        value={newParameter.value}
                        onChange={(e) => setNewParameter({ ...newParameter, value: e.target.value })}
                        sx={{ flex: 1 }}
                      />
                      <IconButton 
                        onClick={handleAddParameter}
                        color="primary"
                        disabled={!newParameter.key || !newParameter.value}
                        size="small"
                        sx={{
                          '&:hover': {
                            backgroundColor: 'primary.lighter'
                          }
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }} component="div">
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleEvaluate}
                  disabled={isLoading}
                  size="large"
                  startIcon={isLoading ? <CircularProgress size={20} /> : <ScienceIcon />}
                  sx={{ 
                    px: 3,
                    py: 1,
                    fontSize: '1rem',
                    minWidth: '180px',
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
                  {isLoading ? 'Evaluating...' : 'Submit Evaluation'}
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Fade in={!!error}>
            <Alert 
              severity="error" 
              sx={{ 
                mt: 1,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {error}
            </Alert>
          </Fade>
        </Box>
      </Paper>

      <Box sx={{ mt: 2 }}>
        <Card 
          elevation={0} 
          sx={{ 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'all 0.2s',
            '&:hover': {
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }
          }}
        >
          <Box 
            sx={{ 
              p: 2, 
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.default',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              background: 'linear-gradient(45deg, #f5f7fa 0%, #e4e8eb 100%)'
            }}
          >
            <HistoryIcon sx={{ fontSize: 24, color: 'primary.main' }} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 500,
                color: 'text.primary',
                fontSize: '1.1rem'
              }}
            >
              Evaluation History
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      py: 1.5,
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => handleSort('status')}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      Status
                      <SortIcon field="status" />
                    </Stack>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      py: 1.5,
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => handleSort('evaluation_name')}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      Evaluation Name
                      <SortIcon field="evaluation_name" />
                    </Stack>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      py: 1.5,
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => handleSort('dataset_name')}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      Dataset
                      <SortIcon field="dataset_name" />
                    </Stack>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      py: 1.5,
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => handleSort('model_id')}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      Model
                      <SortIcon field="model_id" />
                    </Stack>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      py: 1.5,
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => handleSort('start_time')}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      Start Time
                      <SortIcon field="start_time" />
                    </Stack>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      py: 1.5,
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => handleSort('duration')}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      Duration
                      <SortIcon field="duration" />
                    </Stack>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getSortedHistory().map((evaluation) => (
                  <TableRow 
                    key={evaluation.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {getStatusIcon(evaluation.status)}
                        <Chip 
                          label={evaluation.status.toUpperCase()} 
                          size="small"
                          color={getStatusColor(evaluation.status)}
                          sx={{
                            fontWeight: 600,
                            backgroundColor: alpha('#1976d2', 0.15),
                            '& .MuiChip-label': {
                              color: theme => {
                                switch (evaluation.status) {
                                  case 'completed':
                                    return theme.palette.success.main;
                                  case 'failed':
                                    return theme.palette.error.main;
                                  case 'running':
                                    return theme.palette.primary.main;
                                  default:
                                    return theme.palette.info.main;
                                }
                              }
                            }
                          }}
                        />
                        {evaluation.status === 'completed' && (
                          <Tooltip title="Download Results">
                            <IconButton
                              size="small"
                              onClick={() => handleDownload(evaluation.id, evaluation.usecase_id)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'primary.lighter'
                                }
                              }}
                            >
                              <DownloadIcon fontSize="small" color="primary" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {evaluation.evaluation_name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2">
                        {evaluation.dataset_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        ID: {evaluation.dataset_id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2">
                        {evaluation.model_id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2">
                        {new Date(evaluation.start_time).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2">
                        {evaluation.end_time 
                          ? `${Math.round((new Date(evaluation.end_time).getTime() - new Date(evaluation.start_time).getTime()) / 1000)}s`
                          : evaluation.status === 'running' 
                            ? 'Running...'
                            : '-'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {evaluationHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Stack spacing={1} alignItems="center">
                        <HistoryIcon sx={{ fontSize: 36, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          No evaluation history found
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
};

export default Evaluate; 
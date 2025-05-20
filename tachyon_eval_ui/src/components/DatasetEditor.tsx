import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Grid,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import StorageIcon from '@mui/icons-material/Storage';
import { apiService, Golden } from '../services/api';

const DatasetEditor: React.FC = () => {
  const { datasetName } = useParams<{ datasetName: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const datasetId = location.state?.datasetId;
  const [goldens, setGoldens] = useState<Golden[]>([]);
  const [openGoldenDialog, setOpenGoldenDialog] = useState(false);
  const [editingGolden, setEditingGolden] = useState<Golden | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goldenToDelete, setGoldenToDelete] = useState<Golden | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [newGolden, setNewGolden] = useState<Partial<Golden>>({
    input: '',
    expectedOutput: '',
    context: '',
    retrievalContext: '',
    count: 1,
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openDatasetDialog, setOpenDatasetDialog] = useState(false);
  const [newDataset, setNewDataset] = useState({
    alias: '',
    usecase_id: '',
  });

  useEffect(() => {
    if (!datasetName || !datasetId) {
      setError('Dataset information is missing. Please select a dataset from the list.');
      setIsLoading(false);
      return;
    }
    fetchGoldens();
  }, [datasetName, datasetId]);

  const fetchGoldens = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getGoldens(datasetId);
      setGoldens(data);
    } catch (error) {
      console.error('Error fetching goldens:', error);
      setError('Failed to load goldens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenGoldenDialog = () => {
    setOpenGoldenDialog(true);
  };

  const handleCloseGoldenDialog = () => {
    setOpenGoldenDialog(false);
    setEditingGolden(null);
    setNewGolden({
      input: '',
      expectedOutput: '',
      context: '',
      retrievalContext: '',
      count: 1,
      tags: [],
    });
  };

  const handleEditGolden = (golden: Golden) => {
    setEditingGolden(golden);
    setNewGolden({
      input: golden.input,
      expectedOutput: golden.expectedOutput,
      context: golden.context,
      retrievalContext: golden.retrievalContext,
    });
    setOpenGoldenDialog(true);
  };

  const handleDeleteClick = (golden: Golden) => {
    setGoldenToDelete(golden);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!goldenToDelete) return;

    try {
      await apiService.deleteGolden(datasetName!, goldenToDelete.id);
      setGoldens(goldens.filter(g => g.id !== goldenToDelete.id));
      setDeleteDialogOpen(false);
      setGoldenToDelete(null);
    } catch (error) {
      console.error('Error deleting golden:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete golden');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setGoldenToDelete(null);
  };

  const handleSaveGolden = async () => {
    if (!newGolden.input || !newGolden.expectedOutput) {
      setError('Input and Expected Output are required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      if (editingGolden?.id) {
        // Update existing golden
        const updatedGolden = await apiService.updateGolden(datasetId, editingGolden.id, newGolden);
        setGoldens(goldens.map(g => g.id === updatedGolden.id ? updatedGolden : g));
        setSuccessMessage('Golden updated successfully');
      } else {
        // Create new golden
        const createdGolden = await apiService.createGolden(datasetId, newGolden as Omit<Golden, 'id'>);
        setGoldens([...goldens, createdGolden]);
        setSuccessMessage('Golden created successfully');
      }
      setOpenGoldenDialog(false);
      setEditingGolden(null);
      setNewGolden({
        input: '',
        expectedOutput: '',
        context: '',
        retrievalContext: '',
        count: 1,
        tags: [],
      });
    } catch (error) {
      console.error('Error saving golden:', error);
      setError(error instanceof Error ? error.message : 'Failed to save golden');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newGolden.tags?.includes(newTag.trim())) {
      setNewGolden({
        ...newGolden,
        tags: [...(newGolden.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setNewGolden({
      ...newGolden,
      tags: newGolden.tags?.filter(tag => tag !== tagToDelete) || [],
    });
  };

  const handleGenerate = async () => {
    if (!newGolden.input) {
      setError('Input is required for generation');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const response = await apiService.generateContent(datasetId, newGolden);
              
      // Add to table and close dialog
      setGoldens(response);
      setOpenGoldenDialog(false);
      setNewGolden({
        input: '',
        expectedOutput: '',
        context: '',
        retrievalContext: '',
        count: 1,
        tags: [],
      });
      setSuccessMessage('Generation is in progress. Please comeback after sometime');
    } catch (error) {
      console.error('Error generating content:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
    setSelectedFile(null);
    setImportError(null);
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setSelectedFile(null);
    setImportError(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        setImportError('Please select a JSON file');
        return;
      }
      setSelectedFile(file);
      setImportError(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !datasetId) {
      setImportError('Please select a file');
      return;
    }

    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error('File must contain an array of goldens');
      }

      const validatedGoldens = data.map((item) => {
        if (!item.input || !item.expectedOutput) {
          throw new Error('Golden is missing required fields');
        }
        
        return {
          input: item.input,
          actualOutput: item.actualOutput,
          expectedOutput: item.expectedOutput,
          context: item.context || '',
          retrievalContext: item.retrievalContext || '',
          count: item.count || 0,
          tags: item.tags || []
        };
      });

      const importedGoldens = await apiService.importGoldens(datasetId, validatedGoldens);
      setGoldens([...goldens, ...importedGoldens]);
      handleCloseImportDialog();
    } catch (error) {
      console.error('Error importing file:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import file');
    }
  };

  const handleOpenDatasetDialog = () => {
    setOpenDatasetDialog(true);
  };

  const handleCloseDatasetDialog = () => {
    setOpenDatasetDialog(false);
    setNewDataset({
      alias: '',
      usecase_id: '',
    });
  };

  const handleCreateDataset = async () => {
    if (!newDataset.alias) {
      setError('Alias is required');
      return;
    }

    try {
      await apiService.createDataset(newDataset.alias);
      handleCloseDatasetDialog();
    } catch (error) {
      console.error('Error creating dataset:', error);
      setError(error instanceof Error ? error.message : 'Failed to create dataset');
    }
  };

  const handleExportDataset = () => {
    const exportData = goldens.map(golden => ({
      input: golden.input,
      actualOutput: golden.actualOutput,
      expectedOutput: golden.expectedOutput,
      context: golden.context,
      retrievalContext: golden.retrievalContext,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datasetName}_goldens.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            p: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/datasets')}
            sx={{ mt: 2 }}
          >
            Back to Datasets
          </Button>
        </Paper>
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
              {datasetName}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            {goldens.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportDataset}
                size="small"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'primary.lighter'
                  }
                }}
              >
                Export
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => navigate('/datasets')}
              size="small"
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'primary.lighter'
                }
              }}
            >
              Back to Datasets
            </Button>
          </Stack>
        </Box>

        <Box sx={{ p: 4 }}>
          {goldens.length === 0 ? (
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
                No Goldens Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '400px' }}>
                Import or create goldens to evaluation datasets
              </Typography>
              <Stack direction="row" spacing={3}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="large"
                  onClick={handleOpenGoldenDialog}
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
                  Create Golden
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  size="large"
                  onClick={handleOpenImportDialog}
                  sx={{
                    px: 4,
                    py: 2,
                    fontSize: '1.1rem',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: 'primary.lighter'
                    }
                  }}
                >
                  Import File
                </Button>
              </Stack>
            </Box>
          ) : (
            <TableContainer 
              component={Paper} 
              elevation={0} 
              sx={{ 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>Input</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>Expected Output</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>Context</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {goldens.map((golden) => (
                    <TableRow 
                      key={golden.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" noWrap>
                          {golden.input}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" noWrap>
                          {golden.expectedOutput}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" noWrap>
                          {golden.context}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit Golden">
                            <IconButton
                              onClick={() => handleEditGolden(golden)}
                              size="small"
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'primary.lighter'
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Golden">
                            <IconButton
                              onClick={() => handleDeleteClick(golden)}
                              size="small"
                              color="error"
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
        open={openGoldenDialog}
        onClose={handleCloseGoldenDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingGolden ? 'Edit Golden' : 'Create New Golden'}
          <IconButton
            aria-label="close"
            onClick={handleCloseGoldenDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Input"
              multiline
              rows={3}
              fullWidth
              value={newGolden.input}
              onChange={(e) => setNewGolden({ ...newGolden, input: e.target.value })}
            />
            <TextField
              label="Expected Output"
              multiline
              rows={3}
              fullWidth
              value={newGolden.expectedOutput}
              onChange={(e) => setNewGolden({ ...newGolden, expectedOutput: e.target.value })}
            />
            <TextField
              label="Context"
              multiline
              rows={3}
              fullWidth
              value={newGolden.context}
              onChange={(e) => setNewGolden({ ...newGolden, context: e.target.value })}
            />
            <TextField
              label="Retrieval Context"
              multiline
              rows={3}
              fullWidth
              value={newGolden.retrievalContext}
              onChange={(e) => setNewGolden({ ...newGolden, retrievalContext: e.target.value })}
            />
            {!editingGolden && (
              <>
                <TextField
                  label="Count"
                  type="number"
                  fullWidth
                  value={newGolden.count || 1}
                  onChange={(e) => setNewGolden({ ...newGolden, count: parseInt(e.target.value) || 1 })}
                />
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      label="Add Tag"
                      size="small"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button onClick={handleAddTag}>Add</Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {newGolden.tags?.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleDeleteTag(tag)}
                      />
                    ))}
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseGoldenDialog} disabled={isSaving}>Cancel</Button>
          {editingGolden ? (
            <Button
              variant="contained"
              onClick={handleSaveGolden}
              disabled={isSaving || !newGolden.input || !newGolden.expectedOutput}
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSaving ? 'Updating...' : 'Update'}
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutorenewIcon />}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          top: '24px !important',
          '& .MuiAlert-root': {
            minWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '1rem',
            fontWeight: 500
          }
        }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="info" 
          sx={{ 
            width: '100%',
            backgroundColor: 'primary.lighter',
            color: 'primary.dark',
            '& .MuiAlert-icon': {
              color: 'primary.main',
              fontSize: '1.5rem'
            },
            '& .MuiAlert-message': {
              fontSize: '1rem',
              fontWeight: 500,
              padding: '4px 0'
            },
            '& .MuiAlert-action': {
              paddingLeft: '16px'
            },
            '&:hover': {
              backgroundColor: 'primary.light',
              transition: 'background-color 0.2s ease'
            }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Golden</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this golden? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Import Goldens from File
          <IconButton
            aria-label="close"
            onClick={handleCloseImportDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              File Format Instructions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The file should be a JSON array containing golden entries. Each entry should have the following fields:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • input (required): The input text for the golden
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • expectedOutput (required): The expected output
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • context (optional): Additional context information
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • retrievalContext (optional): Context retrieved from knowledge base
              </Typography>
            </Box>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover'
                }
              }}
              component="label"
            >
              <input
                type="file"
                accept=".json"
                hidden
                onChange={handleFileSelect}
              />
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {selectedFile ? selectedFile.name : 'Click to select file'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Only JSON files are supported
              </Typography>
            </Box>

            {importError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {importError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseImportDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!selectedFile}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDatasetDialog}
        onClose={handleCloseDatasetDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Create New Dataset
          <IconButton
            aria-label="close"
            onClick={handleCloseDatasetDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Alias"
              fullWidth
              value={newDataset.alias}
              onChange={(e) => setNewDataset({ ...newDataset, alias: e.target.value })}
              required
            />
            <TextField
              label="Usecase ID"
              fullWidth
              value={newDataset.usecase_id}
              onChange={(e) => setNewDataset({ ...newDataset, usecase_id: e.target.value })}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDatasetDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateDataset}
            disabled={!newDataset.alias || !newDataset.usecase_id}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DatasetEditor; 
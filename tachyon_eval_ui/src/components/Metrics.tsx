import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  useTheme,
  alpha,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  ReferenceArea,
  Brush,
  Area,
  AreaChart,
} from 'recharts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DatasetIcon from '@mui/icons-material/Storage';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { apiService } from '../services/api';

interface DataPoint {
  name: string;
  value: number;
}

interface UsecaseData {
  name: string;
  success: number;
  failure: number;
}

interface EvaluationData {
  name: string;
  score: number;
  accuracy: number;
  latency: number;
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
}

interface SuccessFailureData {
  name: string;
  success: number;
  failure: number;
  total: number;
}

interface DailyMetrics {
  day: string;
  success: number;
  failure: number;
}

// Dummy data for demonstration
const usecaseData: UsecaseData[] = [
  { name: 'Customer Support', success: 85, failure: 15 },
  { name: 'Product Reviews', success: 92, failure: 8 },
  { name: 'FAQ Analysis', success: 78, failure: 22 },
  { name: 'Content Generation', success: 88, failure: 12 },
  { name: 'Code Review', success: 95, failure: 5 },
  { name: 'Documentation', success: 82, failure: 18 },
  { name: 'Bug Analysis', success: 87, failure: 13 },
  { name: 'Security Scan', success: 91, failure: 9 },
];

const datasetData: DataPoint[] = [
  { name: 'Customer Support Dataset', value: 35 },
  { name: 'Product Reviews Dataset', value: 25 },
  { name: 'FAQ Dataset', value: 20 },
  { name: 'Code Review Dataset', value: 15 },
  { name: 'Documentation Dataset', value: 12 },
  { name: 'Bug Reports Dataset', value: 10 },
  { name: 'Security Dataset', value: 8 },
  { name: 'General Dataset', value: 5 },
];

const evaluationData: EvaluationData[] = [
  { name: 'Jan', score: 75, accuracy: 82, latency: 1200 },
  { name: 'Feb', score: 82, accuracy: 85, latency: 1100 },
  { name: 'Mar', score: 88, accuracy: 89, latency: 950 },
  { name: 'Apr', score: 85, accuracy: 87, latency: 980 },
  { name: 'May', score: 90, accuracy: 92, latency: 850 },
  { name: 'Jun', score: 92, accuracy: 94, latency: 800 },
];

const modelPerformanceData = [
  { name: 'Gemini Pro 2.0', accuracy: 92, latency: 850, cost: 0.002 },
  { name: 'Gemini Flash 2.0', accuracy: 88, latency: 450, cost: 0.001 },
  { name: 'Dialog Flow', accuracy: 85, latency: 1200, cost: 0.0015 },
  { name: 'Claude 3', accuracy: 90, latency: 900, cost: 0.0025 },
  { name: 'GPT-4', accuracy: 94, latency: 1100, cost: 0.003 },
];

const successFailureTrendData: SuccessFailureData[] = [
  { name: 'Jan', success: 75, failure: 25, total: 100 },
  { name: 'Feb', success: 82, failure: 18, total: 100 },
  { name: 'Mar', success: 88, failure: 12, total: 100 },
  { name: 'Apr', success: 85, failure: 15, total: 100 },
  { name: 'May', success: 90, failure: 10, total: 100 },
  { name: 'Jun', success: 92, failure: 8, total: 100 },
];

const dailyMetricsData: DailyMetrics[] = [
  { day: '1', success: 92, failure: 8 },
  { day: '2', success: 88, failure: 12 },
  { day: '3', success: 95, failure: 5 },
  { day: '4', success: 90, failure: 10 },
  { day: '5', success: 87, failure: 13 },
  { day: '6', success: 93, failure: 7 },
  { day: '7', success: 89, failure: 11 },
  { day: '8', success: 91, failure: 9 },
  { day: '9', success: 94, failure: 6 },
  { day: '10', success: 88, failure: 12 },
  { day: '11', success: 92, failure: 8 },
  { day: '12', success: 90, failure: 10 },
  { day: '13', success: 93, failure: 7 },
  { day: '14', success: 89, failure: 11 },
  { day: '15', success: 91, failure: 9 },
  { day: '16', success: 95, failure: 5 },
  { day: '17', success: 88, failure: 12 },
  { day: '18', success: 92, failure: 8 },
  { day: '19', success: 90, failure: 10 },
  { day: '20', success: 94, failure: 6 },
  { day: '21', success: 87, failure: 13 },
  { day: '22', success: 93, failure: 7 },
  { day: '23', success: 91, failure: 9 },
  { day: '24', success: 89, failure: 11 },
  { day: '25', success: 95, failure: 5 },
  { day: '26', success: 88, failure: 12 },
  { day: '27', success: 92, failure: 8 },
  { day: '28', success: 90, failure: 10 },
  { day: '29', success: 94, failure: 6 },
  { day: '30', success: 91, failure: 9 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];

const Metrics: React.FC = () => {
  const theme = useTheme();
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationHistory[]>([
    {
      id: 'eval_001',
      name: 'Customer Support Analysis v1',
      dataset_id: 'dataset_1',
      dataset_name: 'Customer Support Dataset',
      model_id: 'gemini_pro_2_0',
      temperature: '0.7',
      status: 'completed',
      start_time: new Date(Date.now() - 3600000).toISOString(),
      end_time: new Date(Date.now() - 1800000).toISOString(),
      parameters: [{ name: 'temperature', value: '0.7' }],
      evaluation_name: 'Customer Support Analysis v1'
    },
    {
      id: 'eval_002',
      name: 'Product Review Sentiment Analysis',
      dataset_id: 'dataset_2',
      dataset_name: 'Product Reviews Dataset',
      model_id: 'gemini_flash_2_0',
      temperature: '0.5',
      status: 'running',
      start_time: new Date(Date.now() - 1800000).toISOString(),
      parameters: [{ name: 'temperature', value: '0.5' }],
      evaluation_name: 'Product Review Sentiment Analysis'
    },
    {
      id: 'eval_003',
      name: 'FAQ Analysis',
      dataset_id: 'dataset_3',
      dataset_name: 'FAQ Dataset',
      model_id: 'google_dialog_flow',
      temperature: '0.8',
      status: 'failed',
      start_time: new Date(Date.now() - 7200000).toISOString(),
      end_time: new Date(Date.now() - 7000000).toISOString(),
      parameters: [{ name: 'temperature', value: '0.8' }],
      evaluation_name: 'FAQ Analysis'
    },
    {
      id: 'eval_004',
      name: 'Code Review Analysis',
      dataset_id: 'dataset_4',
      dataset_name: 'Code Review Dataset',
      model_id: 'claude_3',
      temperature: '0.6',
      status: 'completed',
      start_time: new Date(Date.now() - 86400000).toISOString(),
      end_time: new Date(Date.now() - 82800000).toISOString(),
      parameters: [{ name: 'temperature', value: '0.6' }],
      evaluation_name: 'Code Review Analysis'
    },
    {
      id: 'eval_005',
      name: 'Security Scan Analysis',
      dataset_id: 'dataset_5',
      dataset_name: 'Security Dataset',
      model_id: 'gpt_4',
      temperature: '0.4',
      status: 'completed',
      start_time: new Date(Date.now() - 172800000).toISOString(),
      end_time: new Date(Date.now() - 169200000).toISOString(),
      parameters: [{ name: 'temperature', value: '0.4' }],
      evaluation_name: 'Security Scan Analysis'
    },
    {
      id: 'eval_006',
      name: 'Documentation Analysis',
      dataset_id: 'dataset_6',
      dataset_name: 'Documentation Dataset',
      model_id: 'gemini_pro_2_0',
      temperature: '0.7',
      status: 'completed',
      start_time: new Date(Date.now() - 259200000).toISOString(),
      end_time: new Date(Date.now() - 255600000).toISOString(),
      parameters: [{ name: 'temperature', value: '0.7' }],
      evaluation_name: 'Documentation Analysis'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [brushStartIndex, setBrushStartIndex] = useState<number>(0);
  const [brushEndIndex, setBrushEndIndex] = useState<number>(successFailureTrendData.length - 1);

  useEffect(() => {
    fetchEvaluationHistory();
  }, []);

  const fetchEvaluationHistory = async () => {
    try {
      const history = await apiService.getEvaluationHistory();
      // setEvaluationHistory(history);
    } catch (error) {
      console.error('Failed to fetch evaluation history:', error);
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

  const getOverallStatus = () => {
    const total = evaluationHistory.length;
    if (total === 0) return { status: 'No evaluations', color: 'info' };

    const completed = evaluationHistory.filter(e => e.status === 'completed').length;
    const failed = evaluationHistory.filter(e => e.status === 'failed').length;
    const running = evaluationHistory.filter(e => e.status === 'running').length;

    if (failed > 0) return { status: 'Issues Detected', color: 'error' };
    if (running > 0) return { status: 'In Progress', color: 'primary' };
    if (completed === total) return { status: 'All Successful', color: 'success' };
    return { status: 'Pending', color: 'info' };
  };

  const overallStatus = getOverallStatus();

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const onBrushChange = (newDomain: { startIndex?: number; endIndex?: number }) => {
    if (typeof newDomain.startIndex === 'number') {
      setBrushStartIndex(newDomain.startIndex);
    }
    if (typeof newDomain.endIndex === 'number') {
      setBrushEndIndex(newDomain.endIndex);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            border: '1px solid',
            borderColor: theme.palette.divider,
            borderRadius: 2,
            p: 1.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: entry.color
                }}
              />
              <Typography variant="body2">
                {entry.name}: {entry.value}%
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1600px', mx: 'auto' }}>
      <Box 
        sx={{ 
          mb: 4, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          background: 'linear-gradient(45deg, #f5f7fa 0%, #e4e8eb 100%)',
          p: 3,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <AssessmentIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Evaluation Metrics
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Overall Status */}
        <Grid size={{ xs: 12 }} component="div">
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                {getStatusIcon(overallStatus.color as any)}
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Overall Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {evaluationHistory.length} total evaluations
                  </Typography>
                </Box>
                <Chip 
                  label={overallStatus.status}
                  color={overallStatus.color as any}
                  sx={{ ml: 'auto' }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Evaluations */}
        <Grid size={{ xs: 12 }} component="div">
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Recent Evaluations
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Evaluation Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Dataset</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Start Time</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Temperature</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evaluationHistory.slice(0, 5).map((evaluation) => (
                      <TableRow 
                        key={evaluation.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {getStatusIcon(evaluation.status)}
                            <Chip 
                              label={evaluation.status.toUpperCase()} 
                              size="small"
                              color={getStatusColor(evaluation.status)}
                              sx={{
                                fontWeight: 500,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1)
                              }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {evaluation.evaluation_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {evaluation.dataset_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {evaluation.model_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(evaluation.start_time).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {evaluation.end_time 
                              ? `${Math.round((new Date(evaluation.end_time).getTime() - new Date(evaluation.start_time).getTime()) / 1000)}s`
                              : evaluation.status === 'running' 
                                ? 'Running...'
                                : '-'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {evaluation.temperature}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Success/Failure Trend - Full Width */}
        <Grid size={{ xs: 12 }} component="div">
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <AssessmentIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Success/Failure Trend
                </Typography>
              </Box>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={successFailureTrendData}>
                    <defs>
                      <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="failureGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                    <XAxis 
                      dataKey="name" 
                      stroke={theme.palette.text.secondary}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke={theme.palette.text.secondary}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="success"
                      name="Success Rate"
                      stroke={theme.palette.success.main}
                      fillOpacity={1}
                      fill="url(#successGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="failure"
                      name="Failure Rate"
                      stroke={theme.palette.error.main}
                      fillOpacity={1}
                      fill="url(#failureGradient)"
                    />
                    <ReferenceLine y={90} stroke={theme.palette.success.main} strokeDasharray="3 3" />
                    <Brush
                      dataKey="name"
                      height={30}
                      stroke={theme.palette.primary.main}
                      startIndex={brushStartIndex}
                      endIndex={brushEndIndex}
                      onChange={onBrushChange}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Average Success Rate: {Math.round(successFailureTrendData.reduce((acc, curr) => acc + curr.success, 0) / successFailureTrendData.length)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Evaluations: {successFailureTrendData.reduce((acc, curr) => acc + curr.total, 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* First Row of Two Charts */}
        <Grid size={{ xs: 12, md: 6 }} component="div">
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <AssessmentIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Daily Distribution
                </Typography>
              </Box>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyMetricsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                    <XAxis 
                      dataKey="day" 
                      stroke={theme.palette.text.secondary}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke={theme.palette.text.secondary}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="success" 
                      name="Success Rate" 
                      fill={theme.palette.success.main}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                    <Bar 
                      dataKey="failure" 
                      name="Failure Rate" 
                      fill={theme.palette.error.main}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                    <ReferenceLine y={90} stroke={theme.palette.success.main} strokeDasharray="3 3" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Month Average: {Math.round(dailyMetricsData.reduce((acc, curr) => acc + curr.success, 0) / dailyMetricsData.length)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Best Day: {Math.max(...dailyMetricsData.map(d => d.success))}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} component="div">
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <ScienceIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Usecase Performance
                </Typography>
              </Box>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usecaseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        borderRadius: 8
                      }}
                    />
                    <Legend />
                    <Bar dataKey="success" name="Success Rate" fill={theme.palette.success.main} />
                    <Bar dataKey="failure" name="Failure Rate" fill={theme.palette.error.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Second Row of Two Charts */}
        <Grid size={{ xs: 12, md: 6 }} component="div">
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <DatasetIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Dataset Distribution
                </Typography>
              </Box>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datasetData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent: number }) => 
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      activeIndex={activeIndex ?? undefined}
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                      animationDuration={1500}
                    >
                      {datasetData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          style={{
                            filter: activeIndex === index ? 'brightness(1.2)' : 'none',
                            transition: 'all 0.3s'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} component="div">
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <ScienceIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Model Performance
                </Typography>
              </Box>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modelPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                    <YAxis yAxisId="left" stroke={theme.palette.primary.main} />
                    <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        borderRadius: 8
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="accuracy" name="Accuracy (%)" fill={theme.palette.primary.main} />
                    <Bar yAxisId="right" dataKey="latency" name="Latency (ms)" fill={theme.palette.secondary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Metrics; 
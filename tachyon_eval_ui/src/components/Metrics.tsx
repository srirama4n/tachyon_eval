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
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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

interface MetricData {
  name: string;
  threshold: number;
  success: boolean;
  score: number;
  reason: string;
  strictMode: boolean;
  evaluationModel: string;
  verboseLogs: string;
}

interface EvaluationData {
  id: string;
  evaluation_id: string;
  evaluation_name: string;
  dataset_id: string;
  model_id: string;
  usecase_id: string;
  status: string;
  created_at: string;
  data: {
    name: string;
    input: string;
    actualoutput: string;
    expectedOutput: string;
    context: string[];
    retrievalContext: string[];
    success: boolean;
    metricsData: MetricData[];
    runDuration: number;
    order: number;
  };
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
const dummyEvaluations: EvaluationData[] = [
  {
    id: "4ad2fc3a-cd7d-44ae-891c-42672307929b",
    evaluation_id: "2796d972-7a28-4a08-9a5c-e9bbbdb10f69",
    evaluation_name: "PasskeyDataset Gemini Pro 2.0 Evaluation",
    dataset_id: "24ad9f92-f215-491f-a468-7fbb68cd241b",
    model_id: "gemini pro 2_0",
    usecase_id: "DINDCG_108_Fargo",
    status: "completed",
    created_at: "2025-05-20T17:56:44.9702",
    data: {
      name: "PasskeyDataSet Gemini Pro 2.0 Evaluation",
      input: "What is Passkey?",
      actualoutput: "A passkey is a more secure way to sign in without having to remember a password.",
      expectedOutput: "",
      context: ["A passkey is"],
      retrievalContext: ["A passkey is a"],
      success: true,
      metricsData: [
        {
          name: "Answer Relevancy",
          threshold: 0.5,
          success: true,
          score: 1,
          reason: "The score is 1.00 because the response is perfectly relevant and contains no irrelevant information, excellent!",
          strictMode: false,
          evaluationModel: "gemini-2.0-flash",
          verboseLogs: ""
        }
      ],
      runDuration: 4.8231744000004255,
      order: 0
    }
  },
  {
    id: "5bd3fc4b-de8e-55bf-992d-53783418040c",
    evaluation_id: "3897e083-8b39-5b19-bb6d-f0cccec21g80",
    evaluation_name: "SecurityDataset Gemini Flash Evaluation",
    dataset_id: "35be0a03-g326-602g-b579-8gcc79de352c",
    model_id: "gemini flash",
    usecase_id: "DINDCG_109_Security",
    status: "completed",
    created_at: "2025-05-21T10:30:15.1234",
    data: {
      name: "SecurityDataset Gemini Flash Evaluation",
      input: "What is two-factor authentication?",
      actualoutput: "Two-factor authentication (2FA) is a security process that requires users to provide two different authentication factors to verify their identity.",
      expectedOutput: "",
      context: ["Two-factor authentication"],
      retrievalContext: ["Two-factor authentication is"],
      success: true,
      metricsData: [
        {
          name: "Answer Relevancy",
          threshold: 0.5,
          success: true,
          score: 0.95,
          reason: "The response is highly relevant with minor room for improvement in detail.",
          strictMode: false,
          evaluationModel: "gemini-flash",
          verboseLogs: ""
        }
      ],
      runDuration: 3.9123456000001234,
      order: 1
    }
  }
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
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];

const Metrics: React.FC = () => {
  const theme = useTheme();
  const [evaluations, setEvaluations] = useState<EvaluationData[]>(dummyEvaluations);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [brushStartIndex, setBrushStartIndex] = useState<number>(0);
  const [brushEndIndex, setBrushEndIndex] = useState<number>(successFailureTrendData.length - 1);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('week');
  const [customDays, setCustomDays] = useState<number>(1);
  const [customWeeks, setCustomWeeks] = useState<number>(1);
  const [customMonths, setCustomMonths] = useState<number>(1);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setIsLoading(true);
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate API response with dummy data
      const response = {
        data: dummyEvaluations,
        status: 200,
        message: 'Successfully fetched evaluations'
      };

      // Simulate error handling
      if (response.status !== 200) {
        throw new Error(response.message);
      }

      setEvaluations(response.data);
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
      // You could add error state handling here if needed
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
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
    const total = evaluations.length;
    if (total === 0) return { status: 'No evaluations', color: 'info' };

    const completed = evaluations.filter(e => e.status === 'completed').length;
    const failed = evaluations.filter(e => e.status === 'failed').length;
    const running = evaluations.filter(e => e.status === 'running').length;

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

  const handleTimeFilterChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeFilter: 'day' | 'week' | 'month' | null,
  ) => {
    if (newTimeFilter !== null) {
      setTimeFilter(newTimeFilter);
    }
  };

  const handleCustomDaysChange = (event: any) => {
    setCustomDays(event.target.value);
  };

  const handleCustomWeeksChange = (event: any) => {
    setCustomWeeks(event.target.value);
  };

  const handleCustomMonthsChange = (event: any) => {
    setCustomMonths(event.target.value);
  };

  const getFilteredData = () => {
    const now = new Date();
    const filteredEvaluations = evaluations.filter(evaluation => {
      const evaluationDate = new Date(evaluation.created_at);
      switch (timeFilter) {
        case 'day':
          const daysAgo = new Date(now.getTime() - customDays * 24 * 60 * 60 * 1000);
          return evaluationDate >= daysAgo;
        case 'week':
          const weeksAgo = new Date(now.getTime() - customWeeks * 7 * 24 * 60 * 60 * 1000);
          return evaluationDate >= weeksAgo;
        case 'month':
          const monthsAgo = new Date(now.getTime() - customMonths * 30 * 24 * 60 * 60 * 1000);
          return evaluationDate >= monthsAgo;
        default:
          return true;
      }
    });
    return filteredEvaluations;
  };

  const filteredEvaluations = getFilteredData();

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'day':
        return customDays === 1 ? '1 day' : `${customDays} days`;
      case 'week':
        return customWeeks === 1 ? '1 week' : `${customWeeks} weeks`;
      case 'month':
        return customMonths === 1 ? '1 month' : `${customMonths} months`;
      default:
        return timeFilter;
    }
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
        <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={timeFilter}
            exclusive
            onChange={handleTimeFilterChange}
            aria-label="time filter"
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                py: 1,
                border: '1px solid',
                borderColor: 'divider',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              },
            }}
          >
            <ToggleButton value="day" aria-label="day">
              Day
            </ToggleButton>
            <ToggleButton value="week" aria-label="week">
              Week
            </ToggleButton>
            <ToggleButton value="month" aria-label="month">
              Month
            </ToggleButton>
          </ToggleButtonGroup>
          
          {timeFilter === 'day' && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Days</InputLabel>
              <Select
                value={customDays}
                onChange={handleCustomDaysChange}
                label="Days"
                sx={{
                  backgroundColor: 'background.paper',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider',
                  },
                }}
              >
                <MenuItem value={1}>1 Day</MenuItem>
                <MenuItem value={2}>2 Days</MenuItem>
                <MenuItem value={3}>3 Days</MenuItem>
                <MenuItem value={4}>4 Days</MenuItem>
                <MenuItem value={5}>5 Days</MenuItem>
                <MenuItem value={6}>6 Days</MenuItem>
                <MenuItem value={7}>7 Days</MenuItem>
              </Select>
            </FormControl>
          )}

          {timeFilter === 'week' && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Weeks</InputLabel>
              <Select
                value={customWeeks}
                onChange={handleCustomWeeksChange}
                label="Weeks"
                sx={{
                  backgroundColor: 'background.paper',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider',
                  },
                }}
              >
                <MenuItem value={1}>1 Week</MenuItem>
                <MenuItem value={2}>2 Weeks</MenuItem>
                <MenuItem value={3}>3 Weeks</MenuItem>
                <MenuItem value={4}>4 Weeks</MenuItem>
                <MenuItem value={8}>8 Weeks</MenuItem>
                <MenuItem value={12}>12 Weeks</MenuItem>
              </Select>
            </FormControl>
          )}

          {timeFilter === 'month' && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Months</InputLabel>
              <Select
                value={customMonths}
                onChange={handleCustomMonthsChange}
                label="Months"
                sx={{
                  backgroundColor: 'background.paper',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider',
                  },
                }}
              >
                <MenuItem value={1}>1 Month</MenuItem>
                <MenuItem value={2}>2 Months</MenuItem>
                <MenuItem value={3}>3 Months</MenuItem>
                <MenuItem value={6}>6 Months</MenuItem>
                <MenuItem value={12}>12 Months</MenuItem>
                <MenuItem value={24}>24 Months</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
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
                    {filteredEvaluations.length} evaluations in the last {getTimeFilterLabel()}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <AssessmentIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Recent Evaluations
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Evaluation Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Dataset ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Success</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEvaluations.map((evaluation) => (
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
                          <Typography variant="caption" color="text.secondary">
                            ID: {evaluation.evaluation_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {evaluation.dataset_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Usecase: {evaluation.usecase_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={evaluation.model_id}
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(evaluation.created_at).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {evaluation.data.runDuration.toFixed(2)}s
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={evaluation.data.success ? 'Success' : 'Failed'}
                            color={evaluation.data.success ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {(evaluation.data.metricsData[0]?.score * 100).toFixed(1)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={evaluation.data.metricsData[0]?.score * 100}
                              sx={{
                                width: 60,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: evaluation.data.metricsData[0]?.score >= 0.8 
                                    ? theme.palette.success.main 
                                    : evaluation.data.metricsData[0]?.score >= 0.5 
                                    ? theme.palette.warning.main 
                                    : theme.palette.error.main
                                }
                              }}
                            />
                          </Box>
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
                  Metrics Distribution
                </Typography>
              </Box>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={evaluations.flatMap(e => e.data.metricsData)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, score }: { name: string; score: number }) => 
                        `${name} (${(score * 100).toFixed(0)}%)`
                      }
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="score"
                      activeIndex={activeIndex ?? undefined}
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                      animationDuration={1500}
                    >
                      {evaluations.flatMap(e => e.data.metricsData).map((entry, index) => (
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
      </Grid>
    </Box>
  );
};

export default Metrics; 
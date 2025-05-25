import React, { useState } from 'react';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DatasetIcon from '@mui/icons-material/Storage';
import ScienceIcon from '@mui/icons-material/Science';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link, Navigate } from 'react-router-dom';
import Datasets from './components/Datasets';
import DatasetEditor from './components/DatasetEditor';
import Evaluate from './components/Evaluate';
import Metrics from './components/Metrics';
import Landing from './components/Landing';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
    },
    secondary: {
      main: '#666666',
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #e0e0e0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
        contained: {
          backgroundColor: '#000000',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f5f5f5',
          fontWeight: 600,
        },
      },
    },
  },
});

const drawerWidth = 240;

function MainContent() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const useCaseId = localStorage.getItem('useCaseId');
  const location = window.location.pathname;

  // Reset use case ID when accessing root URL
  React.useEffect(() => {
    if (location === '/') {
      localStorage.removeItem('useCaseId');
      // Instead of reloading, just navigate to the same route
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const menuItems = [
    { text: 'Datasets', icon: <DatasetIcon />, path: '/datasets' },
    { text: 'Evaluate', icon: <ScienceIcon />, path: '/evaluate' },
    { text: 'Metrics', icon: <AssessmentIcon />, path: '/metrics' },
  ];

  // If no use case ID, only show the landing page with themed header
  if (!useCaseId) {
    return (
      <Box sx={{ display: 'flex' }}>
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: '#000000',
          }}
        >
          <Toolbar sx={{ minHeight: '64px' }}>
            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'auto'
            }}>
              <Typography 
                variant="h6" 
                noWrap 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  color: '#ffffff',
                }}
              >
                Tachyon Eval
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.8,
                  color: '#ffffff',
                  fontWeight: 500
                }}
              >
                AI based evaluation framework
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: '100%',
            mt: '64px',
            backgroundColor: '#ffffff',
            minHeight: '100vh'
          }}
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#000000',
        }}
      >
        <Toolbar sx={{ minHeight: '64px' }}>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2,
              color: '#ffffff',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'auto'
          }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              Tachyon Eval
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.8,
                color: '#ffffff',
                fontWeight: 500
              }}
            >
              AI based evaluation framework
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? drawerWidth : 65,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : 65,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: 'width 0.2s',
            backgroundColor: '#f5f5f5',
            borderRight: '1px solid #e0e0e0',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', p: 1 }}>
          <IconButton 
            onClick={handleDrawerToggle}
            sx={{
              color: '#000000',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.text}
              onClick={() => {
                navigate(item.path);
                if (window.innerWidth < 600) {
                  setDrawerOpen(false);
                }
              }}
              sx={{
                minHeight: 48,
                justifyContent: drawerOpen ? 'initial' : 'center',
                px: 2.5,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: drawerOpen ? 3 : 'auto',
                  justifyContent: 'center',
                  color: '#000000'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: drawerOpen ? 1 : 0,
                  transition: 'opacity 0.2s',
                  color: '#000000',
                  '& .MuiTypography-root': {
                    fontWeight: 500
                  }
                }} 
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 65}px)` },
          mt: '64px',
          transition: 'margin 0.2s',
          backgroundColor: '#ffffff',
          minHeight: '100vh'
        }}
      >
        <Routes>
          <Route path="/evaluate" element={<Evaluate />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/datasets" element={<Datasets />} />
          <Route 
            path="/datasets/:datasetName" 
            element={
              <React.StrictMode>
                <DatasetEditor />
              </React.StrictMode>
            } 
          />
          <Route path="*" element={<Navigate to="/evaluate" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const useCaseId = localStorage.getItem('useCaseId');
  
  if (!useCaseId) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <MainContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetWorkspacesQuery } from '@/features/auth/authApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setWorkspace } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const WorkspaceSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { token, isAuthenticated, workspace, user } = useAppSelector((state) => state.auth);

  // Workspace selector state
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  // RTK Query hooks
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useGetWorkspacesQuery(undefined, {
    skip: !token,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login2');
    }
  }, [isAuthenticated, token, navigate]);

  // Redirect if already has workspace
  useEffect(() => {
    if (workspace) {
      navigate('/dashboard');
    }
  }, [workspace, navigate]);

  // Handle Workspace Selection
  const handleWorkspaceSelect = () => {
    if (!selectedWorkspaceId) {
      toast.error('Please select a workspace');
      return;
    }

    const selected = workspaces?.find((ws) => ws.id === selectedWorkspaceId);
    if (selected) {
      dispatch(setWorkspace(selected));
      toast.success(`Switched to workspace: ${selected.name}`);
      navigate('/dashboard');
    }
  };

  // Handle Create Workspace
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWorkspaceName) {
      toast.error('Workspace name is required');
      return;
    }

    try {
      // TODO: Implement create workspace API call
      // For now, show a message that it's not implemented yet
      toast.error('Create workspace feature coming soon! Please contact admin to create a workspace.');
      
      // Reset form
      setNewWorkspaceName('');
      setShowCreateWorkspace(false);
    } catch (error: any) {
      toast.error('Failed to create workspace');
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="pt-12 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-brand-secondary mb-3">
            Welcome, {firstName}!
          </h1>
          <p className="text-lg text-gray-700">
            Choose a workspace to continue, or create a new one
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        {isLoadingWorkspaces ? (
          <Card className="shadow-lg bg-white border-brand-accent">
            <CardContent className="flex justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-brand-primary mx-auto mb-4" />
                <p className="text-gray-600">Loading your workspaces...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Existing Workspaces */}
            {workspaces && workspaces.length > 0 && (
              <Card className="shadow-lg bg-white border-brand-accent">
                <CardHeader>
                  <CardTitle className="text-2xl text-brand-secondary">Your Workspaces</CardTitle>
                  <CardDescription className="text-gray-600">
                    You have access to {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workspaces.map((ws) => {
                    // Placeholder data for demo purposes
                    const memberCount = ws.current_members_count || Math.floor(Math.random() * 20) + 1;
                    const projectCount = ws.current_projects_count || Math.floor(Math.random() * 15);
                    const planName = ws.subscription_plan_id === 1 ? 'Free Plan' : 
                                    ws.subscription_plan_id === 2 ? 'Starter' :
                                    ws.subscription_plan_id === 3 ? 'Professional' : 'Enterprise';
                    
                    return (
                      <div
                        key={ws.id}
                        onClick={() => setSelectedWorkspaceId(ws.id)}
                        className={`p-5 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md bg-white ${
                          selectedWorkspaceId === ws.id
                            ? 'border-brand-primary bg-brand-accent-light/50'
                            : 'border-brand-accent hover:border-brand-primary-hover'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-brand-secondary">{ws.name}</h3>
                              {ws.subscription_status && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  ws.subscription_status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : ws.subscription_status === 'trial'
                                    ? 'bg-brand-primary-hover/20 text-brand-secondary'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {ws.subscription_status === 'active' ? '✓ Active' : 
                                   ws.subscription_status === 'trial' ? '🎯 Trial' : 
                                   ws.subscription_status}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-500 mb-3">
                              {ws.slug}
                            </p>
                            
                            <div className="flex gap-4 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">👥</span>
                                <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">📁</span>
                                <span>{projectCount} project{projectCount !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">💳</span>
                                <span>{planName}</span>
                              </div>
                            </div>
                          </div>
                          {selectedWorkspaceId === ws.id && (
                            <div className="ml-4">
                              <div className="h-7 w-7 bg-brand-primary rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">✓</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full h-11 text-base font-semibold bg-brand-primary hover:bg-brand-primary-hover"
                    onClick={handleWorkspaceSelect}
                    disabled={!selectedWorkspaceId}
                  >
                    {selectedWorkspaceId 
                      ? `Continue to ${workspaces.find(w => w.id === selectedWorkspaceId)?.name}`
                      : 'Select a workspace to continue'}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Create New Workspace - Compact Version */}
            {!showCreateWorkspace ? (
              <div className="text-center">
                <Button
                  variant="outline"
                  className="border-2 border-dashed border-brand-accent text-gray-600 hover:border-brand-primary-hover hover:text-brand-primary hover:bg-brand-accent-light/50 bg-white"
                  onClick={() => setShowCreateWorkspace(true)}
                >
                  <span className="text-xl mr-2">+</span>
                  Create New Workspace
                </Button>
              </div>
            ) : (
              <Card className="shadow-lg border-brand-primary-hover bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-brand-secondary">Create New Workspace</CardTitle>
                  <CardDescription className="text-gray-600">
                    Start a new workspace for your organization
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateWorkspace}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-workspace-name">Workspace Name</Label>
                      <Input
                        id="new-workspace-name"
                        type="text"
                        placeholder="My Company Name"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowCreateWorkspace(false);
                        setNewWorkspaceName('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-brand-primary hover:bg-brand-primary-hover"
                    >
                      Create
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}

            {/* No Workspaces Message */}
            {(!workspaces || workspaces.length === 0) && !isLoadingWorkspaces && (
              <Card className="shadow-lg bg-brand-accent-light border-brand-accent">
                <CardContent className="py-8 text-center">
                  <div className="text-5xl mb-4">🏢</div>
                  <h3 className="text-xl font-semibold text-brand-secondary mb-2">
                    No Workspaces Yet
                  </h3>
                  <p className="text-gray-700 mb-4">
                    You don't have access to any workspaces yet. Create your first workspace to get started!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSelectorPage;

import React, { useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { useGetRecentAuditLogsQuery, useGetEntityAuditLogsQuery, useGetRelatedAuditLogsQuery } from '@/features/financialAuditLogs/financialAuditLogsApi';

const AuditTestPage: React.FC = () => {
    const { workspace } = useAppSelector((state) => state.auth);

    // Audit Log state
    const [auditLogViewType, setAuditLogViewType] = useState<'recent' | 'entity' | 'related'>('recent');
    const [auditLogEntityType, setAuditLogEntityType] = useState<'account' | 'invoice' | 'payment'>('account');
    const [auditLogEntityId, setAuditLogEntityId] = useState<number | null>(null);

    // Audit Logs API hooks
    const { data: recentAuditLogs, isLoading: isLoadingRecentLogs, refetch: refetchRecentLogs } = useGetRecentAuditLogsQuery(
        { limit: 50 },
        { skip: !workspace || auditLogViewType !== 'recent' }
    );
    const { data: entityAuditLogs, isLoading: isLoadingEntityLogs, refetch: refetchEntityLogs } = useGetEntityAuditLogsQuery(
        { entityType: auditLogEntityType, entityId: auditLogEntityId || 0 },
        { skip: !workspace || auditLogViewType !== 'entity' || !auditLogEntityId }
    );
    const { data: relatedAuditLogs, isLoading: isLoadingRelatedLogs, refetch: refetchRelatedLogs } = useGetRelatedAuditLogsQuery(
        { entityType: auditLogEntityType, entityId: auditLogEntityId || 0 },
        { skip: !workspace || auditLogViewType !== 'related' || !auditLogEntityId }
    );

    if (!workspace) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
                    Please select a workspace in the API Test Page first.
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Audit Test Page</h1>

            {/* Financial Audit Logs Section */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Financial Audit Logs (Active Workspace: {workspace.name})
                </h2>

                {/* View Type Selector */}
                <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold mb-3 text-purple-900">View Audit Logs</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <button
                            onClick={() => {
                                setAuditLogViewType('recent');
                                refetchRecentLogs();
                            }}
                            className={`px-4 py-2 rounded-md ${auditLogViewType === 'recent'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-purple-600 border border-purple-600 hover:bg-purple-50'
                                }`}
                        >
                            Recent Activity
                        </button>
                        <button
                            onClick={() => setAuditLogViewType('entity')}
                            className={`px-4 py-2 rounded-md ${auditLogViewType === 'entity'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-purple-600 border border-purple-600 hover:bg-purple-50'
                                }`}
                        >
                            By Entity
                        </button>
                        <button
                            onClick={() => setAuditLogViewType('related')}
                            className={`px-4 py-2 rounded-md ${auditLogViewType === 'related'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-purple-600 border border-purple-600 hover:bg-purple-50'
                                }`}
                        >
                            Related Entities
                        </button>
                    </div>

                    {/* Entity Selector (for entity and related views) */}
                    {(auditLogViewType === 'entity' || auditLogViewType === 'related') && (
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                                <select
                                    value={auditLogEntityType}
                                    onChange={(e) => setAuditLogEntityType(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="account">Account</option>
                                    <option value="invoice">Invoice</option>
                                    <option value="payment">Payment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Entity ID</label>
                                <input
                                    type="number"
                                    value={auditLogEntityId || ''}
                                    onChange={(e) => setAuditLogEntityId(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Enter ID"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        if (auditLogViewType === 'entity') {
                                            refetchEntityLogs();
                                        } else {
                                            refetchRelatedLogs();
                                        }
                                    }}
                                    disabled={!auditLogEntityId}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                                >
                                    Load Logs
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Audit Logs List */}
                <div>
                    {auditLogViewType === 'recent' && (
                        <>
                            <h3 className="font-semibold mb-3">Recent Activity (Last 50 Actions)</h3>
                            {isLoadingRecentLogs ? (
                                <p className="text-gray-600">Loading audit logs...</p>
                            ) : recentAuditLogs && recentAuditLogs.length > 0 ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {recentAuditLogs.map((log) => (
                                        <div key={log.id} className="border rounded p-3 bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded font-semibold">
                                                            {log.entity_type.toUpperCase()}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                                                            {log.action_type.toUpperCase()}
                                                        </span>
                                                        {log.related_entity_type && (
                                                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                                                                → {log.related_entity_type.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-900 font-medium">
                                                        {log.description || `${log.action_type} on ${log.entity_type} #${log.entity_id}`}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {new Date(log.performed_at).toLocaleString()}
                                                    </p>
                                                    {log.changes && (
                                                        <details className="mt-2">
                                                            <summary className="text-xs text-purple-600 cursor-pointer hover:text-purple-800">
                                                                View Changes
                                                            </summary>
                                                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                                                {JSON.stringify(log.changes, null, 2)}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600">No audit logs found</p>
                            )}
                        </>
                    )}

                    {auditLogViewType === 'entity' && auditLogEntityId && (
                        <>
                            <h3 className="font-semibold mb-3">
                                Audit Logs for {auditLogEntityType} #{auditLogEntityId}
                            </h3>
                            {isLoadingEntityLogs ? (
                                <p className="text-gray-600">Loading audit logs...</p>
                            ) : entityAuditLogs && entityAuditLogs.length > 0 ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {entityAuditLogs.map((log) => (
                                        <div key={log.id} className="border rounded p-3 bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                                                            {log.action_type.toUpperCase()}
                                                        </span>
                                                        {log.related_entity_type && (
                                                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                                                                → {log.related_entity_type.toUpperCase()} #{log.related_entity_id}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-900 font-medium">
                                                        {log.description || `${log.action_type} on ${log.entity_type} #${log.entity_id}`}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {new Date(log.performed_at).toLocaleString()}
                                                    </p>
                                                    {log.changes && (
                                                        <details className="mt-2">
                                                            <summary className="text-xs text-purple-600 cursor-pointer hover:text-purple-800">
                                                                View Changes
                                                            </summary>
                                                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                                                {JSON.stringify(log.changes, null, 2)}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600">No audit logs found for this entity</p>
                            )}
                        </>
                    )}

                    {auditLogViewType === 'related' && auditLogEntityId && (
                        <>
                            <h3 className="font-semibold mb-3">
                                Related Audit Logs for {auditLogEntityType} #{auditLogEntityId}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Showing all logs for this {auditLogEntityType} and its related entities
                            </p>
                            {isLoadingRelatedLogs ? (
                                <p className="text-gray-600">Loading audit logs...</p>
                            ) : relatedAuditLogs && relatedAuditLogs.length > 0 ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {relatedAuditLogs.map((log) => (
                                        <div key={log.id} className="border rounded p-3 bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded font-semibold">
                                                            {log.entity_type.toUpperCase()} #{log.entity_id}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                                                            {log.action_type.toUpperCase()}
                                                        </span>
                                                        {log.related_entity_type && (
                                                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                                                                → {log.related_entity_type.toUpperCase()} #{log.related_entity_id}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-900 font-medium">
                                                        {log.description || `${log.action_type} on ${log.entity_type} #${log.entity_id}`}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {new Date(log.performed_at).toLocaleString()}
                                                    </p>
                                                    {log.changes && (
                                                        <details className="mt-2">
                                                            <summary className="text-xs text-purple-600 cursor-pointer hover:text-purple-800">
                                                                View Changes
                                                            </summary>
                                                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                                                {JSON.stringify(log.changes, null, 2)}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600">No related audit logs found</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditTestPage;

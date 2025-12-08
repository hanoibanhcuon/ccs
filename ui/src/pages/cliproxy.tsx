/**
 * CLIProxy Page
 * Phase 03: REST API Routes & CRUD
 * Phase 06: Multi-Account Management
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Plus, Check, X, User, ChevronDown, Star, Trash2 } from 'lucide-react';
import { CliproxyTable } from '@/components/cliproxy-table';
import { CliproxyDialog } from '@/components/cliproxy-dialog';
import {
  useCliproxy,
  useCliproxyAuth,
  useSetDefaultAccount,
  useRemoveAccount,
} from '@/hooks/use-cliproxy';
import type { OAuthAccount, AuthStatus } from '@/lib/api-client';

function AccountBadge({
  account,
  onSetDefault,
  onRemove,
  isRemoving,
}: {
  account: OAuthAccount;
  onSetDefault: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border transition-colors hover:bg-muted/50 ${
            account.isDefault
              ? 'border-primary/30 bg-primary/5 text-primary'
              : 'border-muted bg-muted/20'
          }`}
        >
          <User className="w-3 h-3" />
          <span className="max-w-[120px] truncate">{account.email || account.id}</span>
          {account.isDefault && <Star className="w-3 h-3 fill-current" />}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {account.email || account.id}
          {account.lastUsedAt && (
            <div className="mt-0.5">
              Last used: {new Date(account.lastUsedAt).toLocaleDateString()}
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        {!account.isDefault && (
          <DropdownMenuItem onClick={onSetDefault}>
            <Star className="w-4 h-4 mr-2" />
            Set as default
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={onRemove}
          disabled={isRemoving}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isRemoving ? 'Removing...' : 'Remove account'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProviderCard({
  status,
  setDefaultMutation,
  removeMutation,
}: {
  status: AuthStatus;
  setDefaultMutation: ReturnType<typeof useSetDefaultAccount>;
  removeMutation: ReturnType<typeof useRemoveAccount>;
}) {
  const accounts = status.accounts || [];
  const hasMultipleAccounts = accounts.length > 1;

  return (
    <div
      className={`p-4 rounded-lg border ${
        status.authenticated ? 'border-green-500/30 bg-green-500/5' : 'border-muted bg-muted/5'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status.authenticated ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <X className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="font-medium">{status.displayName}</span>
        </div>
        {accounts.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {status.authenticated ? (
        <div className="mt-2">
          {accounts.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {accounts.map((account) => (
                <AccountBadge
                  key={account.id}
                  account={account}
                  onSetDefault={() =>
                    setDefaultMutation.mutate({
                      provider: status.provider,
                      accountId: account.id,
                    })
                  }
                  onRemove={() =>
                    removeMutation.mutate({
                      provider: status.provider,
                      accountId: account.id,
                    })
                  }
                  isRemoving={removeMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Authenticated
              {status.lastAuth && (
                <span className="ml-1">({new Date(status.lastAuth).toLocaleDateString()})</span>
              )}
            </div>
          )}
          {hasMultipleAccounts && (
            <div className="mt-2 text-xs text-muted-foreground">
              Click account to manage. Star = default.
            </div>
          )}
          <div className="mt-2 text-xs text-muted-foreground">
            Add account: <code className="bg-muted px-1 rounded">ccs {status.provider} --auth</code>
          </div>
        </div>
      ) : (
        <div className="mt-1 text-sm text-muted-foreground">
          Not authenticated
          <span className="block text-xs mt-1">
            Run: <code className="bg-muted px-1 rounded">ccs {status.provider} --auth</code>
          </span>
        </div>
      )}
    </div>
  );
}

export function CliproxyPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useCliproxy();
  const { data: authData, isLoading: authLoading } = useCliproxyAuth();
  const setDefaultMutation = useSetDefaultAccount();
  const removeMutation = useRemoveAccount();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CLIProxy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage OAuth-based provider variants with multi-account support
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Variant
        </Button>
      </div>

      {/* Built-in Profiles with Account Management */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Built-in Profiles & Accounts</h2>
        {authLoading ? (
          <div className="text-muted-foreground">Loading auth status...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {authData?.authStatus.map((status) => (
              <ProviderCard
                key={status.provider}
                status={status}
                setDefaultMutation={setDefaultMutation}
                removeMutation={removeMutation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Custom Variants */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Custom Variants</h2>
        {isLoading ? (
          <div className="text-muted-foreground">Loading variants...</div>
        ) : (
          <CliproxyTable data={data?.variants || []} />
        )}
      </div>

      <CliproxyDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}

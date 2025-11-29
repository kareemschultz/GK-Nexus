import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Lock,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Folder as FolderType } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";

interface FolderTreeProps {
  folders: (FolderType & { children: any[] })[];
  selectedFolderId?: string;
  onFolderSelect: (folderId?: string) => void;
  onCreateFolder?: (parentId?: string) => void;
  className?: string;
}

interface FolderNodeProps {
  folder: FolderType & { children: any[] };
  level: number;
  selectedFolderId?: string;
  onFolderSelect: (folderId?: string) => void;
  onCreateFolder?: (parentId?: string) => void;
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
}

const FolderNode = ({
  folder,
  level,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  expandedFolders,
  toggleFolder,
}: FolderNodeProps) => {
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const hasChildren = folder.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-muted/50",
          isSelected && "bg-muted",
          level > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <Button
          className="h-4 w-4 p-0 hover:bg-transparent"
          disabled={!hasChildren}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              toggleFolder(folder.id);
            }
          }}
          size="sm"
          variant="ghost"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <div className="h-3 w-3" />
          )}
        </Button>

        <div
          className="flex min-w-0 flex-1 items-center gap-2"
          onClick={() => onFolderSelect(folder.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onFolderSelect(folder.id);
            }
          }}
          role="button"
          tabIndex={0}
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0 text-blue-600" />
          ) : (
            <Folder className="h-4 w-4 flex-shrink-0 text-blue-600" />
          )}

          <span className="truncate font-medium">{folder.name}</span>

          {folder.isConfidential && (
            <Lock className="h-3 w-3 flex-shrink-0 text-red-500" />
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-muted-foreground text-xs">
            {folder.documentCount}
          </span>

          {onCreateFolder && folder.permissions.write && (
            <Button
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onCreateFolder(folder.id);
              }}
              size="sm"
              title="Create subfolder"
              variant="ghost"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {folder.children.map((child) => (
            <FolderNode
              expandedFolders={expandedFolders}
              folder={child}
              key={child.id}
              level={level + 1}
              onCreateFolder={onCreateFolder}
              onFolderSelect={onFolderSelect}
              selectedFolderId={selectedFolderId}
              toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree = ({
  folders,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  className,
}: FolderTreeProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-muted-foreground text-sm">Folders</h3>
        {onCreateFolder && (
          <Button
            className="h-6 w-6 p-0"
            onClick={() => onCreateFolder()}
            size="sm"
            title="Create new folder"
            variant="ghost"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted/50",
          !selectedFolderId && "bg-muted"
        )}
        onClick={() => onFolderSelect()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onFolderSelect();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <Folder className="h-4 w-4 text-blue-600" />
        <span className="font-medium">All Documents</span>
      </div>

      {folders.map((folder) => (
        <FolderNode
          expandedFolders={expandedFolders}
          folder={folder}
          key={folder.id}
          level={0}
          onCreateFolder={onCreateFolder}
          onFolderSelect={onFolderSelect}
          selectedFolderId={selectedFolderId}
          toggleFolder={toggleFolder}
        />
      ))}
    </div>
  );
};

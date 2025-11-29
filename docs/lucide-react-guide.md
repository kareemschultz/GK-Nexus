# Lucide React Icons Guide

This guide helps prevent icon import errors that can cause module resolution issues in the GK-Nexus application.

## ✅ **Valid Icon Names**

Always use these valid icon names when importing from `lucide-react`:

### Common Icons We Use:
```typescript
// User Interface
import { User, Users, UserCheck, UserPlus, UserMinus, UserX } from "lucide-react";

// Navigation
import { Home, Menu, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

// Actions
import { Plus, Edit, Trash2, Save, Download, Upload, Share, Copy } from "lucide-react";

// Status & Feedback
import { Check, CheckCircle, CheckCircle2, AlertCircle, AlertTriangle, Info, XCircle } from "lucide-react";

// Files & Documents
import { File, FileText, Folder, FolderOpen, Image, Video, Music } from "lucide-react";

// Business & Finance
import { Calculator, DollarSign, CreditCard, Receipt, TrendingUp, BarChart3, PieChart } from "lucide-react";

// Communication
import { Mail, Phone, MessageSquare, Bell, Calendar } from "lucide-react";

// System & Settings
import { Settings, Cog, Lock, Unlock, Eye, EyeOff, Search } from "lucide-react";

// Building & Location
import { Building2, MapPin, Home, Office } from "lucide-react"; // Note: Use Building2, not Building

// Time & Date
import { Clock, Calendar, CalendarDays, Timer } from "lucide-react";
```

## ❌ **Icons That Don't Exist (AVOID)**

These icon names will cause import errors:

```typescript
// ❌ WRONG - These don't exist in lucide-react
import {
  Stop,           // Use: Square, Pause, or XCircle
  FilePdf,        // Use: FileType, File, or FileText
  Print,          // Use: Printer
  FileCheck,      // Use: CheckCircle, FileText + Check
  FileImage,      // Use: Image, File
  Target,         // Use: MapPin, Crosshair, or Focus
  Building,       // Use: Building2
  Scale,          // Use: Scale (this one exists, but Scales doesn't)
  Scales,         // Use: Scale
  XIcon,          // Use: X
  CheckIcon,      // Use: Check
  CircleIcon,     // Use: Circle
  ChevronRightIcon, // Use: ChevronRight
  InfoIcon,       // Use: Info
} from "lucide-react";
```

## ✅ **Correct Replacements**

When you encounter these problematic icons, replace them with valid alternatives:

| ❌ Invalid | ✅ Valid Alternative | Use Case |
|-----------|-------------------|----------|
| `Stop` | `Square` or `Pause` | Stop buttons, pause actions |
| `FilePdf` | `FileType` or `File` | PDF file icons |
| `Print` | `Printer` | Print functionality |
| `FileCheck` | `CheckCircle` | Approved files |
| `FileImage` | `Image` | Image file icons |
| `Target` | `MapPin` or `Crosshair` | Location, targeting |
| `Building` | `Building2` | Company, office icons |
| `Scales` | `Scale` | Legal, justice icons |
| `XIcon` | `X` | Close buttons |
| `CheckIcon` | `Check` | Checkmarks |
| `CircleIcon` | `Circle` | Circular indicators |
| `ChevronRightIcon` | `ChevronRight` | Navigation arrows |
| `InfoIcon` | `Info` | Information indicators |

## 🔍 **How to Find Valid Icons**

1. **Search the official Lucide website**: https://lucide.dev/icons/
2. **Use their search function** to find the exact icon name
3. **Check the copy button** for the correct import name

## 🛠 **Development Workflow**

1. **Before adding new icons:**
   - Search on https://lucide.dev/
   - Copy the exact icon name from the website
   - Test the import in your IDE

2. **If you encounter an import error:**
   - Check this guide for common replacements
   - Search for alternatives on the Lucide website
   - Update the import and component usage

3. **When updating existing code:**
   - Use Find & Replace carefully
   - Test the application after changes
   - Check for any HMR (Hot Module Reload) errors

## 🚨 **Common Import Patterns**

```typescript
// ✅ CORRECT - Destructured imports
import { User, Building2, Check, X } from "lucide-react";

// ✅ CORRECT - Usage in JSX
<Building2 className="h-5 w-5" />
<Check className="h-4 w-4" />

// ❌ WRONG - Don't use non-existent icons
import { Building, CheckIcon } from "lucide-react";
```

## 📝 **Quick Reference Commands**

Search for potentially problematic icons in your codebase:
```bash
# Find files with potentially invalid icon imports
grep -r "from.*lucide-react" --include="*.tsx" --include="*.ts"

# Search for specific problematic patterns
grep -r "Stop\|FilePdf\|Print\|Building\|Scales\|Target" --include="*.tsx" --include="*.ts"
```

## 🎯 **Best Practices**

1. **Always verify icon names** on the official Lucide website
2. **Use TypeScript** to catch import errors at compile time
3. **Test imports immediately** after adding them
4. **Keep this guide updated** when you discover new valid/invalid icons
5. **Use semantic icon names** that match their purpose

## 📚 **Resources**

- [Lucide React Official Docs](https://lucide.dev/)
- [Lucide React Icons Library](https://lucide.dev/icons/)
- [Lucide React NPM Package](https://www.npmjs.com/package/lucide-react)

---

**Remember**: When in doubt, search the official Lucide website first! 🔍
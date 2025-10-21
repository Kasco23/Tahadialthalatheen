# Pages - Deprecated

**Last Updated**: October 21, 2025  
**Total Deprecated**: 1 page

---

## Removed Pages

### Join.tsx (Original)

- **Deprecated On**: October 17, 2025
- **Reason**: Replaced by JoinSimplified.tsx with better UX
- **Replacement**: JoinSimplified.tsx
- **Location**: Moved to `/src/deprecated/`
- **Status**: ❌ Inactive, not imported in App.tsx
- **Key Differences**:
  - Old: Multi-step wizard flow
  - New: Single-page form with better visual design
  - New: Simplified role selection
  - New: Better mobile responsiveness

**Migration Notes**:

- All routes updated to use `/join` with JoinSimplified
- No breaking changes for users
- Session code validation logic preserved
- Custom hooks extracted for reusability

---

## Considered for Deprecation

None currently. All 13 pages are actively used in the application flow.

---

## Historical Notes

### Why Join.tsx was replaced

1. UX feedback indicated multi-step was confusing
2. Single-page form reduced abandonment rate
3. Better alignment with mobile-first design
4. Simplified code maintenance

---

## See Also

- **CurrentState.md** - Active pages
- **Changelog.md** - Recent changes
- **Overview.md** - Category introduction

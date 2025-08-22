import { Link } from 'react-router-dom';

/**
 * Basic 404 page for unknown routes.  Provides a link back to the
 * home page to aid navigation.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 p-4">
      <h1 className="text-3xl font-bold">404 - الصفحة غير موجودة</h1>
      <Link
        to="/"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
}

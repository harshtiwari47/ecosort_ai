import { ArrowLeft, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <div className="page not-found-page"><div className="not-found-mark"><Leaf size={25} aria-hidden="true" /></div><p className="eyebrow">404 · Not found</p><h1>This path doesn’t sort.</h1><p>The page may have moved or the address may be incomplete.</p><Link className="button button-primary" to="/"><ArrowLeft size={15} aria-hidden="true" /> Back to overview</Link></div>;
}

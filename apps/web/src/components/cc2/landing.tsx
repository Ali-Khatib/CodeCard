import { Cc2Builders } from './builders';
import { Cc2Circle } from './circle';
import { Cc2Closing } from './closing';
import { Cc2Hero } from './hero';
import { Cc2Journey } from './journey';
import { Cc2Manifesto } from './manifesto';
import { Cc2Work } from './work';
import '@/styles/cc2-landing.css';

/**
 * Marketing `/`.
 * Hero → the order → one introduction, start to finish → featured work →
 * the circle → who it is for → the finale.
 * Ink and paper alternate; signal appears in objects and, once, as the finale.
 */
export function Cc2Landing() {
  return (
    <div className="cc2-landing" data-testid="cc2-landing">
      <Cc2Hero />
      <Cc2Manifesto />
      <Cc2Journey />
      <Cc2Work />
      <Cc2Circle />
      <Cc2Builders />
      <Cc2Closing />
    </div>
  );
}

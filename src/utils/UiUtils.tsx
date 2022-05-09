export function doElementsOverlap(element1: HTMLElement, element2: HTMLElement): boolean {

  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();
  return !(rect1.right < rect2.left || 
    rect1.left > rect2.right || 
    rect1.bottom < rect2.top || 
    rect1.top > rect2.bottom);
}
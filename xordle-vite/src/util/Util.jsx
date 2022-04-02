export const getClassNameByStatus = (status) => {
  switch(parseInt(status)) {
    case 1: return 'bg-green';
    case 2: return 'bg-yellow';
    case 3: return 'bg-neutral';
    case 4: return 'bg-placeholder active'
    case 5: return 'bg-placeholder'
    default: return 'bg-gray';
  }
}
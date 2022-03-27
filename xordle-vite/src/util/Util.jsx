export const getClassNameByStatus = (status) => {
  switch(parseInt(status)) {
    case 1: return 'bg-green';
    case 2: return 'bg-yellow';
    case 4: return 'bg-neutral';
    case 5: return 'bg-placeholder'
    default: return 'bg-gray';
  }
}

//https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
export const uuidv4 = () => {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
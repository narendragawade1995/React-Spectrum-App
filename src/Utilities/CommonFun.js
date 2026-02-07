
const commonfun = {
    getFileNameAndExtension : (filePath)=> {
        // Get the last segment after the last '/'
        const fileNameWithExtension = filePath.split('/').pop();
      
        // Split the fileNameWithExtension by '.' to get fileName and extension
        const splitFileName = fileNameWithExtension.split('.');
        const fileName = splitFileName.slice(0, -1).join('.'); // Join all elements except the last one
        const extension = splitFileName.pop();
      
        return { fileName, extension };
      },
      base64ToBlob : (base64String, contentType) =>{
        const byteString = atob(base64String.split(',')[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
      
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
      
        return new Blob([arrayBuffer], { type: contentType });
      },

      formatDate : (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).replace(/ /g, ' ');
      }
}

export default commonfun;
 
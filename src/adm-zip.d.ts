declare module "adm-zip" {
  export default class AdmZip {
    constructor(filePath: string);
    getEntry(name: string): { getData(): Buffer } | null;
    readAsText(entry: string): string;
  }
}

declare class JSZip {
    files: { [key: string]: JSZip.JSZipObject };

    /**
     * Get a file from the archive
     *
     * @param Path relative path to file
     * @return File matching path, null if no file found
     */
    file(path: string): JSZip.JSZipObject | null;

    /**
     * Get files matching a RegExp from archive
     *
     * @param path RegExp to match
     * @return Return all matching files or an empty array
     */
    file(path: RegExp): JSZip.JSZipObject[];

    /**
     * Add a file to the archive
     *
     * @param path Relative path to file
     * @param data Content of the file
     * @param options Optional information about the file
     * @return JSZip object
     */
    file<T extends JSZip.InputType>(path: string, data: InputByType[T] | Promise<InputByType[T]>, options?: JSZip.JSZipFileOptions): this;
    file<T extends JSZip.InputType>(path: string, data: null, options?: JSZip.JSZipFileOptions & { dir: true }): this;

    /**
     * Returns an new JSZip instance with the given folder as root
     *
     * @param name Name of the folder
     * @return New JSZip object with the given folder as root or null
     */
    folder(name: string): JSZip | null;

    /**
     * Returns new JSZip instances with the matching folders as root
     *
     * @param name RegExp to match
     * @return New array of JSZipFile objects which match the RegExp
     */
    folder(name: RegExp): JSZip.JSZipObject[];

    /**
     * Call a callback function for each entry at this folder level.
     *
     * @param callback function
     */
    forEach(callback: (relativePath: string, file: JSZip.JSZipObject) => void): void;

    /**
     * Get all files which match the given filter function
     *
     * @param predicate Filter function
     * @return Array of matched elements
     */
    filter(predicate: (relativePath: string, file: JSZip.JSZipObject) => boolean): JSZip.JSZipObject[];

    /**
     * Removes the file or folder from the archive
     *
     * @param path Relative path of file or folder
     * @return Returns the JSZip instance
     */
    remove(path: string): JSZip;

    /**
     * Generates a new archive asynchronously
     *
     * @param options Optional options for the generator
     * @param onUpdate The optional function called on each internal update with the metadata.
     * @return The serialized archive
     */
    generateAsync<T extends JSZip.OutputType>(options?: JSZip.JSZipGeneratorOptions<T>, onUpdate?: JSZip.OnUpdateCallback): Promise<OutputByType[T]>;

    /**
     * Generates a new archive asynchronously
     *
     * @param options Optional options for the generator
     * @param onUpdate The optional function called on each internal update with the metadata.
     * @return A Node.js `ReadableStream`
     */
    generateNodeStream(options?: JSZip.JSZipGeneratorOptions<'nodebuffer'>, onUpdate?: JSZip.OnUpdateCallback): NodeJS.ReadableStream;

    /**
     * Generates the complete zip file with the internal stream implementation
     *
     * @param options Optional options for the generator
     * @return a StreamHelper
     */
    generateInternalStream<T extends JSZip.OutputType>(options?: JSZip.JSZipGeneratorOptions<T>): JSZip.JSZipStreamHelper<OutputByType[T]>;

    /**
     * Deserialize zip file asynchronously
     *
     * @param data Serialized zip file
     * @param options Options for deserializing
     * @return Returns promise
     */
    loadAsync(data: InputFileFormat, options?: JSZip.JSZipLoadOptions): Promise<JSZip>;

    support: JSZipSupport;
    external: {
        Promise: PromiseConstructorLike;
    };
    version: string;
}

declare function JSZip(): JSZip;

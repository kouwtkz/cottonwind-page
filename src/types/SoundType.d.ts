interface SoundDataType {
  id?: number;
  key: string;
  src?: string;
  track?: number;
  title?: string;
  description?: string;
  album?: string;
  cover?: string;
  artist?: string;
  grouping?: string;
  genre?: string;
  draft?: number;
  time?: string;
  mtime?: string;
  lastmod?: string;
}

interface SoundItemType extends SoundDataType, WithRawDataType<SoundDataType> {
  genre?: string[];
  grouping?: string[];
  draft?: boolean;
  common?: ICommonTagsResult;
  meta?: IAudioMetadata;
  time?: Date;
  lastmod?: Date;
}

interface SoundPlaylistType {
  title?: string;
  list: SoundItemType[];
}

interface SoundAlbumDataType {
  id?: number;
  key: string;
  title?: string;
  description?: string;
  order?: number;
  artist?: string;
  cover?: string;
  category?: string;
  setup?: number;
  draft?: number;
  time?: string;
  lastmod?: string;
}

interface SoundAlbumType extends SoundAlbumDataType, WithRawDataType<SoundAlbumDataType> {
  playlist?: SoundPlaylistType;
  setup?: boolean;
  draft?: boolean;
  time?: Date;
  lastmod?: Date;
}

type SoundLoopMode = "off" | "loop" | "loopOne" | "playUntilEnd";

type TagType = 'vorbis' | 'ID3v1' | 'ID3v2.2' | 'ID3v2.3' | 'ID3v2.4' | 'APEv2' | 'asf' | 'iTunes' | 'exif' | 'matroska' | 'AIFF';
type GenericTagId = 'track' | 'disk' | 'year' | 'title' | 'artist' | 'artists' | 'albumartist' | 'album' | 'date' | 'originaldate' | 'originalyear' | 'releasedate' | 'comment' | 'genre' | 'picture' | 'composer' | 'lyrics' | 'albumsort' | 'titlesort' | 'work' | 'artistsort' | 'albumartistsort' | 'composersort' | 'lyricist' | 'writer' | 'conductor' | 'remixer' | 'arranger' | 'engineer' | 'technician' | 'producer' | 'djmixer' | 'mixer' | 'publisher' | 'label' | 'grouping' | 'subtitle' | 'discsubtitle' | 'totaltracks' | 'totaldiscs' | 'compilation' | 'rating' | 'bpm' | 'mood' | 'media' | 'catalognumber' | 'tvShow' | 'tvShowSort' | 'tvEpisode' | 'tvEpisodeId' | 'tvNetwork' | 'tvSeason' | 'podcast' | 'podcasturl' | 'releasestatus' | 'releasetype' | 'releasecountry' | 'script' | 'language' | 'copyright' | 'license' | 'encodedby' | 'encodersettings' | 'gapless' | 'barcode' | 'isrc' | 'asin' | 'musicbrainz_recordingid' | 'musicbrainz_trackid' | 'musicbrainz_albumid' | 'musicbrainz_artistid' | 'musicbrainz_albumartistid' | 'musicbrainz_releasegroupid' | 'musicbrainz_workid' | 'musicbrainz_trmid' | 'musicbrainz_discid' | 'acoustid_id' | 'acoustid_fingerprint' | 'musicip_puid' | 'musicip_fingerprint' | 'website' | 'performer:instrument' | 'peakLevel' | 'averageLevel' | 'notes' | 'key' | 'originalalbum' | 'originalartist' | 'discogs_artist_id' | 'discogs_label_id' | 'discogs_master_release_id' | 'discogs_rating' | 'discogs_release_id' | 'discogs_votes' | 'replaygain_track_gain' | 'replaygain_track_peak' | 'replaygain_album_gain' | 'replaygain_album_peak' | 'replaygain_track_minmax' | 'replaygain_album_minmax' | 'replaygain_undo' | 'description' | 'longDescription' | 'category' | 'hdVideo' | 'keywords' | 'movement' | 'movementIndex' | 'movementTotal' | 'podcastId' | 'showMovement' | 'stik';

interface ITagFlags {
  containsHeader: boolean;
  containsFooter: boolean;
  isHeader: boolean;
  readOnly: boolean;
  dataType: DataType;
}
declare enum DataType {
  text_utf8 = 0,
  binary = 1,
  external_info = 2,
  reserved = 3
}
interface IFooter {
  ID: string;
  version: number;
  size: number;
  fields: number;
  flags: ITagFlags;
}

declare enum TrackType {
  video = 1,
  audio = 2,
  complex = 3,
  logo = 4,
  subtitle = 17,
  button = 18,
  control = 32
}
/**
 * https://id3.org/id3v2.3.0#Synchronised_lyrics.2Ftext
 */
enum LyricsContentType {
  other = 0,
  lyrics = 1,
  text = 2,
  movement_part = 3,
  events = 4,
  chord = 5,
  trivia_pop = 6
}
enum TimestampFormat {
  notSynchronized0 = 0,
  mpegFrameNumber = 1,
  milliseconds = 2
}

type AnyTagValue = unknown;
/**
 * Attached picture, typically used for cover art
 */
interface IPicture {
  /**
   * Image mime type
   */
  format: string;
  /**
   * Image data
   */
  data: Uint8Array;
  /**
   * Optional description
   */
  description?: string;
  /**
   * Picture type
   */
  type?: string;
  /**
   * File name
   */
  name?: string;
}
/**
 * Abstract interface to access rating information
 */
interface IRating {
  /**
   * Rating source, could be an e-mail address
   */
  source?: string;
  /**
   * Rating [0..1]
   */
  rating?: number;
}
interface ICommonTagsResult {
  track: {
    no: number | null;
    of: number | null;
  };
  disk: {
    no: number | null;
    of: number | null;
  };
  /**
   * Release year
   */
  year?: number;
  /**
   * Track title
   */
  title?: string;
  /**
   * Track, maybe several artists written in a single string.
   */
  artist?: string;
  /**
   * Track artists, aims to capture every artist in a different string.
   */
  artists?: string[];
  /**
   * Track album artists
   */
  albumartist?: string;
  /**
   * Album title
   */
  album?: string;
  /**
   * Date
   */
  date?: string;
  /**
   * Original release date
   */
  originaldate?: string;
  /**
   * Original release year
   */
  originalyear?: number;
  /**
   * Release date
   */
  releasedate?: string;
  /**
   * List of comments
   */
  comment?: IComment[];
  /**
   * Genre
   */
  genre?: string[];
  /**
   * Embedded album art
   */
  picture?: IPicture[];
  /**
   * Track composer
   */
  composer?: string[];
  /**
   * Synchronized lyrics
   */
  lyrics?: ILyricsTag[];
  /**
   * Album title, formatted for alphabetic ordering
   */
  albumsort?: string;
  /**
   * Track title, formatted for alphabetic ordering
   */
  titlesort?: string;
  /**
   * The canonical title of the work
   */
  work?: string;
  /**
   * Track artist, formatted for alphabetic ordering
   */
  artistsort?: string;
  /**
   * Album artist, formatted for alphabetic ordering
   */
  albumartistsort?: string;
  /**
   * Composer, formatted for alphabetic ordering
   */
  composersort?: string;
  /**
   * Lyricist(s)
   */
  lyricist?: string[];
  /**
   * Writer(s)
   */
  writer?: string[];
  /**
   * Conductor(s)
   */
  conductor?: string[];
  /**
   * Remixer(s)
   */
  remixer?: string[];
  /**
   * Arranger(s)
   */
  arranger?: string[];
  /**
   * Engineer(s)
   */
  engineer?: string[];
  /**
   * Publisher(s)
   */
  publisher?: string[];
  /**
   * Producer(s)
   */
  producer?: string[];
  /**
   * Mix-DJ(s)
   */
  djmixer?: string[];
  /**
   * Mixed by
   */
  mixer?: string[];
  technician?: string[];
  label?: string[];
  grouping?: string;
  subtitle?: string[];
  description?: string[];
  longDescription?: string;
  discsubtitle?: string[];
  totaltracks?: string;
  totaldiscs?: string;
  movementTotal?: number;
  compilation?: boolean;
  rating?: IRating[];
  bpm?: number;
  /**
   * Keywords to reflect the mood of the audio, e.g. 'Romantic' or 'Sad'
   */
  mood?: string;
  /**
   * Release format, e.g. 'CD'
   */
  media?: string;
  /**
   * Release catalog number(s)
   */
  catalognumber?: string[];
  /**
   * TV show title
   */
  tvShow?: string;
  /**
   * TV show title, formatted for alphabetic ordering
   */
  tvShowSort?: string;
  /**
   * TV season title sequence number
   */
  tvSeason?: number;
  /**
   * TV Episode sequence number
   */
  tvEpisode?: number;
  /**
   * TV episode ID
   */
  tvEpisodeId?: string;
  /**
   * TV network
   */
  tvNetwork?: string;
  podcast?: boolean;
  podcasturl?: string;
  releasestatus?: string;
  releasetype?: string[];
  releasecountry?: string;
  script?: string;
  language?: string;
  copyright?: string;
  license?: string;
  encodedby?: string;
  encodersettings?: string;
  gapless?: boolean;
  barcode?: string;
  isrc?: string[];
  asin?: string;
  musicbrainz_recordingid?: string;
  musicbrainz_trackid?: string;
  musicbrainz_albumid?: string;
  musicbrainz_artistid?: string[];
  musicbrainz_albumartistid?: string[];
  musicbrainz_releasegroupid?: string;
  musicbrainz_workid?: string;
  musicbrainz_trmid?: string;
  musicbrainz_discid?: string;
  acoustid_id?: string;
  acoustid_fingerprint?: string;
  musicip_puid?: string;
  musicip_fingerprint?: string;
  website?: string;
  'performer:instrument'?: string[];
  averageLevel?: number;
  peakLevel?: number;
  notes?: string[];
  originalalbum?: string;
  originalartist?: string;
  discogs_artist_id?: number[];
  discogs_release_id?: number;
  discogs_label_id?: number;
  discogs_master_release_id?: number;
  discogs_votes?: number;
  discogs_rating?: number;
  /**
   * Track gain ratio [0..1]
   */
  replaygain_track_gain_ratio?: number;
  /**
   * Track peak ratio [0..1]
   */
  replaygain_track_peak_ratio?: number;
  /**
   * Track gain ratio
   */
  replaygain_track_gain?: IRatio;
  /**
   * Track peak ratio
   */
  replaygain_track_peak?: IRatio;
  /**
   * Album gain ratio
   */
  replaygain_album_gain?: IRatio;
  /**
   * Album peak ratio
   */
  replaygain_album_peak?: IRatio;
  /**
   * minimum & maximum global gain values across a set of files scanned as an album
   */
  replaygain_undo?: {
    leftChannel: number;
    rightChannel: number;
  };
  /**
   * minimum & maximum global gain values across a set of file
   */
  replaygain_track_minmax?: number[];
  /**
   * minimum & maximum global gain values across a set of files scanned as an album
   */
  replaygain_album_minmax?: number[];
  /**
   * The initial key of the music in the file, e.g. "A Minor".
   * Ref: https://docs.microsoft.com/en-us/windows/win32/wmformat/wm-initialkey
   */
  key?: string;
  /**
   * Podcast Category
   */
  category?: string[];
  /**
   * iTunes Video Quality
   *
   * 2: Full HD
   * 1: HD
   * 0: SD
   */
  hdVideo?: number;
  /**
   * Podcast Keywords
   */
  keywords?: string[];
  /**
   * Movement
   */
  movement?: string;
  /**
   * Movement Index/Total
   */
  movementIndex: {
    no: number | null;
    of: number | null;
  };
  /**
   * Podcast Identifier
   */
  podcastId?: string;
  /**
   * Show Movement
   */
  showMovement?: boolean;
  /**
   * iTunes Media Type
   *
   * 1: Normal
   * 2: Audiobook
   * 6: Music Video
   * 9: Movie
   * 10: TV Show
   * 11: Booklet
   * 14: Ringtone
   *
   * https://github.com/sergiomb2/libmp4v2/wiki/iTunesMetadata#user-content-media-type-stik
   */
  stik?: number;
}
interface IRatio {
  /**
   * [0..1]
   */
  ratio: number;
  /**
   * Decibel
   */
  dB: number;
}
type FormatId = 'container' | 'duration' | 'bitrate' | 'sampleRate' | 'bitsPerSample' | 'codec' | 'tool' | 'codecProfile' | 'lossless' | 'numberOfChannels' | 'numberOfSamples' | 'audioMD5' | 'chapters' | 'modificationTime' | 'creationTime' | 'trackPeakLevel' | 'trackGain' | 'albumGain';
interface IAudioTrack {
  samplingFrequency?: number;
  outputSamplingFrequency?: number;
  channels?: number;
  channelPositions?: Uint8Array;
  bitDepth?: number;
}
interface IVideoTrack {
  flagInterlaced?: boolean;
  stereoMode?: number;
  pixelWidth?: number;
  pixelHeight?: number;
  displayWidth?: number;
  displayHeight?: number;
  displayUnit?: number;
  aspectRatioType?: number;
  colourSpace?: Uint8Array;
  gammaValue?: number;
}
interface ITrackInfo {
  type?: TrackType;
  codecName?: string;
  codecSettings?: string;
  flagEnabled?: boolean;
  flagDefault?: boolean;
  flagLacing?: boolean;
  name?: string;
  language?: string;
  audio?: IAudioTrack;
  video?: IVideoTrack;
}
interface IFormat {
  readonly trackInfo: ITrackInfo[];
  /**
   * E.g.: 'flac'
   */
  readonly container?: string;
  /**
   * List of tags found in parsed audio file
   */
  readonly tagTypes: TagType[];
  /**
   * Duration in seconds
   */
  readonly duration?: number;
  /**
   * Number bits per second of encoded audio file
   */
  readonly bitrate?: number;
  /**
   * Sampling rate in Samples per second (S/s)
   */
  readonly sampleRate?: number;
  /**
   * Audio bit depth
   */
  readonly bitsPerSample?: number;
  /**
   * Encoder brand, e.g.: LAME3.99r
   */
  readonly tool?: string;
  /**
   * Encoder name / compressionType, e.g.: 'PCM', 'ITU-T G.711 mu-law'
   */
  readonly codec?: string;
  /**
   * Codec profile
   */
  readonly codecProfile?: string;
  readonly lossless?: boolean;
  /**
   * Number of audio channels
   */
  readonly numberOfChannels?: number;
  /**
   * Number of samples frames.
   * One sample contains all channels
   * The duration is: numberOfSamples / sampleRate
   */
  readonly numberOfSamples?: number;
  /**
   * 16-byte MD5 of raw audio
   */
  readonly audioMD5?: Uint8Array;
  /**
   * Chapters in audio stream
   */
  readonly chapters?: IChapter[];
  /**
   * Time file was created
   */
  readonly creationTime?: Date;
  /**
   * Time file was modified
   */
  readonly modificationTime?: Date;
  readonly trackGain?: number;
  readonly trackPeakLevel?: number;
  readonly albumGain?: number;
}
interface ITag {
  id: string;
  value: AnyTagValue;
}
interface IChapter {
  /**
   * Chapter title
   */
  title: string;
  /**
   * Audio offset in sample number, 0 is the first sample.
   * Duration offset is sampleOffset / format.sampleRate
   */
  sampleOffset: number;
}
/**
 * Flat list of tags
 */
interface INativeTags {
  [tagType: string]: ITag[];
}
/**
 * Tags ordered by tag-ID
 */
interface INativeTagDict {
  [tagId: string]: AnyTagValue[];
}
interface INativeAudioMetadata {
  format: IFormat;
  native: INativeTags;
  quality: IQualityInformation;
}
interface IQualityInformation {
  /**
   * Warnings
   */
  warnings: IParserWarning[];
}
interface IParserWarning {
  message: string;
}
interface IAudioMetadata extends INativeAudioMetadata {
  /**
   * Metadata, form independent interface
   */
  common: ICommonTagsResult;
}
/**
 * Corresponds with parser module name
 */
type ParserType = 'mpeg' | 'apev2' | 'mp4' | 'asf' | 'flac' | 'ogg' | 'aiff' | 'wavpack' | 'riff' | 'musepack' | 'dsf' | 'dsdiff' | 'adts' | 'matroska' | 'amr';
interface IOptions {
  /**
   * default: `false`, if set to `true`, it will parse the whole media file if required to determine the duration.
   */
  duration?: boolean;
  /**
   * default: `false`, if set to `true`, it will skip parsing covers.
   */
  skipCovers?: boolean;
  /**
   * default: `false`, if set to `true`, it will not search all the entire track for additional headers.
   * Only recommenced to use in combination with streams.
   */
  skipPostHeaders?: boolean;
  /**
   * default: `false`, if set to `true`, it will include MP4 chapters
   */
  includeChapters?: boolean;
  /**
   * Set observer for async callbacks to common or format.
   */
  observer?: Observer;
  /**
   * In Matroska based files, use the  _SeekHead_ element index to skip _segment/cluster_ elements.
   * By default, disabled
   * Can have a significant performance impact if enabled.
   * Possible side effect can be that certain metadata maybe skipped, depending on the index.
   * If there is no _SeekHead_ element present in the Matroska file, this flag has no effect
   * Ref: https://www.matroska.org/technical/diagram.html
   */
  mkvUseIndex?: boolean;
}
interface IApeHeader extends IOptions {
  /**
   * Offset of APE-header
   */
  offset: number;
  /**
   * APEv1 / APEv2 header offset
   */
  footer: IFooter;
}
interface IPrivateOptions extends IOptions {
  apeHeader?: IApeHeader;
}
interface IMetadataEventTag {
  /**
   * Either `common` if it is a generic tag event, or `format` for format related updates
   */
  type: 'common' | 'format';
  /**
   * Tag id
   */
  id: keyof ICommonTagsResult | FormatId;
  /**
   * Tag value
   */
  value: AnyTagValue;
}
/**
 * Event definition send after each change to common/format metadata change to observer.
 */
interface IMetadataEvent {
  /**
   * Tag which has been updated.
   */
  tag: IMetadataEventTag;
  /**
   * Metadata model including the attached tag
   */
  metadata: IAudioMetadata;
}
type Observer = (update: IMetadataEvent) => void;
/**
 * Provides random data read access
 * Used read operations on file of buffers
 */
interface IRandomReader {
  /**
   * Total length of file or buffer
   */
  fileSize: number;
  /**
   * Read from a given position of an abstracted file or buffer.
   * @param {Uint8Array} buffer the buffer that the data will be written to.
   * @param {number} offset the offset in the buffer to start writing at.
   * @param {number} length an integer specifying the number of bytes to read.
   * @param {number} position an argument specifying where to begin reading from in the file.
   * @return {Promise<number>} bytes read
   */
  randomRead(buffer: Uint8Array, offset: number, length: number, position: number): Promise<number>;
}
interface ILyricsText {
  text: string;
  timestamp?: number;
}
interface IComment {
  descriptor?: string;
  language?: string;
  text?: string;
}
interface ILyricsTag extends IComment {
  contentType: LyricsContentType;
  timeStampFormat: TimestampFormat;
  /**
   * Un-synchronized lyrics
   */
  text?: string;
  /**
   * Synchronized lyrics
   */
  syncText: ILyricsText[];
}

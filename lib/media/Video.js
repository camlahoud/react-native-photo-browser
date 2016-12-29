import React, { PropTypes, Component } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  ProgressBarAndroid,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Text
} from 'react-native';

import * as Progress from 'react-native-progress';
import Video from 'react-native-video';
const FileOpener = require('react-native-file-opener');

export default class VideoItem extends Component {

  static propTypes = {
    /*
     * image uri or opaque type that is passed as source object to image component
     */
    uri: PropTypes.oneOfType([
      // assets or http url
      PropTypes.string,
      // Opaque type returned by require('./image.jpg')
      PropTypes.number,
    ]).isRequired,
    
    videoSource: PropTypes.oneOfType([
      // assets or http url
      PropTypes.string,
      // Opaque type returned by require('./image.jpg')
      PropTypes.number,
    ]).isRequired,

    /*
     * displays a check button above the image
     */
    displaySelectionButtons: PropTypes.bool,
    /*
     * video mime type
     */
    type: PropTypes.string,
    /*
     * image resizeMode
     */
    resizeMode: PropTypes.string,

    /*
     * these values are set to image and it's container
     * screen width and height are used if those are not defined
     */
    width: PropTypes.number,
    height: PropTypes.number,


    /*
     * when lazyLoad is true,
     * image is not loaded until 'load' method is manually executed
     */
    lazyLoad: PropTypes.bool,

    /*
     * displays selected or unselected icon based on this prop
     */
    selected: PropTypes.bool,

    /*
     * size of selection images are decided based on this
     */
    thumbnail: PropTypes.bool,

    /*
     * executed when user selects/unselects the photo
     */
    onSelection: PropTypes.func,

    /*
     * image tag generated using require(asset_path)
     */
    progressImage: PropTypes.number,

    /*
     * displays Progress.Circle instead of default Progress.Bar
     * it's ignored when progressImage is also passed.
     * iOS only
     */
    useCircleProgress: PropTypes.bool,
  };

  static defaultProps = {
    resizeMode: 'contain',
    thumbnail: false,
    lazyLoad: false,
    selected: false,
  };

  constructor(props) {
    super(props);

    this._onProgress = this._onProgress.bind(this);
    this._onError = this._onError.bind(this);
    this._onLoad = this._onLoad.bind(this);
    this._toggleSelection = this._toggleSelection.bind(this);

    const { lazyLoad, uri, videoSource } = props;

    this.state = {
      uri: lazyLoad ? null : uri,
      videoSource: videoSource,
      progress: 0,
      error: false,
      playVideo: false,
      paused: true
    };
  }

  load() {
    if (!this.state.uri) {
      this.setState({
        uri: this.props.uri,
      });
    }
  }

  _onProgress(event) {
    const progress = event.nativeEvent.loaded / event.nativeEvent.total;
    if (!this.props.thumbnail && progress !== this.state.progress) {
      this.setState({
        progress,
      });
    }
  }

  _onError() {
    this.setState({
      error: true,
      progress: 1,
    });
  }

  _onLoad() {
    this.setState({
      progress: 1,
    });
  }

  _toggleSelection() {
    // onSelection is resolved in index.js
    // and refreshes the dataSource with new media object
    this.props.onSelection(!this.props.selected);
  }

  _renderProgressIndicator() {
    const { progressImage, useCircleProgress } = this.props;
    const { progress } = this.state;

    if (progress < 1) {
      if (progressImage) {
        return (
          <Image
            source={progressImage}
          />
        );
      }

      if (Platform.OS === 'android') {
        return <ActivityIndicator progress={progress} />;
      }

      const ProgressElement = useCircleProgress ? Progress.Circle : Progress.Bar;
      return (
        <ProgressElement
          progress={progress}
          thickness={20}
          color={'white'}
        />
      );
    }
    return null;
  }

  _renderErrorIcon() {
    return (
      <Image
        source={require('../../Assets/image-error.png')}
      />
    );
  }

  _renderSelectionButton() {
    const { progress } = this.state;
    const { displaySelectionButtons, selected, thumbnail } = this.props;

    // do not display selection before image is loaded
    if (!displaySelectionButtons || progress < 1) {
      return null;
    }

    let buttonImage;
    if (thumbnail) {
      let icon = require('../../Assets/small-selected-off.png');
      if (selected) {
        icon = require('../../Assets/small-selected-on.png');
      }

      buttonImage = (
        <Image
          source={icon}
          style={styles.thumbnailSelectionIcon}
        />
      );
    } else {
      let icon = require('../../Assets/selected-off.png');
      if (selected) {
        icon = require('../../Assets/selected-on.png');
      }

      buttonImage = (
        <Image
          style={styles.fullScreenSelectionIcon}
          source={icon}
        />
      );
    }

    return (
      <TouchableWithoutFeedback onPress={this._toggleSelection}>
        {buttonImage}
      </TouchableWithoutFeedback>
    );
  }

  render() {
    const { resizeMode, width, height } = this.props;
    const screen = Dimensions.get('window');
    const { uri, error } = this.state;

    let source;
    if (uri) {
      // create source objects for http/asset strings
      // or directly pass uri number for local files
      source = typeof uri === 'string' ? { uri } : uri;
    }

    // i had to get window size and set photo size here
    // to be able to respond device orientation changes in full screen mode
    // FIX_ME: when you have a better option
    const sizeStyle = {
      width: width || screen.width,
      height: height || screen.height,
    };
    let playBtnPos = {
      top: (sizeStyle.height/2) - 40,
      left: (sizeStyle.width/2) - 40
    }
    let playIcon = require('../../Assets/playbtn.png');
    if (this.props.grid) {
        playBtnPos = {
          top: (sizeStyle.height/2) - 15,
          left: (sizeStyle.width/2) - 15
        }
        return (
            <View style={[styles.container, sizeStyle]}>
                {error ? this._renderErrorIcon() : this._renderProgressIndicator()}
                <Image
                  {...this.props}
                  style={[styles.image, sizeStyle]}
                  source={source}
                  onProgress={this._onProgress}
                  onError={this._onError}
                  onLoad={this._onLoad}
                  resizeMode={resizeMode}
                />
                {(this.state.error || this.state.progress<1)? null :
                <TouchableOpacity style={[styles.gridPlayBtn, playBtnPos]} onPress={this.props.onPress}>
                  <Image source={playIcon} style={styles.gridPlayIcon} />
                </TouchableOpacity>}
                {this._renderSelectionButton()}
            </View>
        );
    }
    var onTap = Platform.OS == 'ios' ? this.props.onPress : null;
    return (
      <View style={[styles.container, sizeStyle]}>
        {error ? this._renderErrorIcon() : this._renderProgressIndicator()}
        <View style={styles.image}>
            <Image
              {...this.props}
              style={[styles.imageView, sizeStyle]}
              source={source}
              onProgress={this._onProgress}
              onError={this._onError}
              onLoad={this._onLoad}
              onTap={onTap}
              resizeMode={resizeMode}
            />
            {(this.state.error || this.state.progress<1)? null :
            <TouchableOpacity style={[styles.playBtn, playBtnPos]} onPress={()=>this._startPlay()}>
              <Image source={playIcon} style={styles.playIcon} />
            </TouchableOpacity>}
            {(this.state.playVideo && Platform.OS=='ios')?
              <Video
                source={{uri: this.state.videoSource}}
                paused={this.state.paused}
                resizeMode="cover"
                ref={player => this.player = player}
                style={{width: 0, height: 0}}
                repeat={true}
                onEnd={() => this._onPlaybackEnd()}
                onFullscreenPlayerWillDismiss={() => this._onPlaybackEnd()}
                onError={this._onError}
              />:
              null
            }
        </View>
        {this._renderSelectionButton()}
      </View>
    );
  }
  
  _startPlay() {
    if (Platform.OS=='android') {
      url = this.state.videoSource.replace('file://','');
      FileOpener.open(
        url,
        this.props.type
      ).catch(err => {
        console.log('Error opening:',err);
      })
    } else {
      this.setState({
        playVideo: true
      },() => {
        this.player.presentFullscreenPlayer();
        this.setState({paused: false})
      })
    }
  }
  
  _onPlaybackEnd() {
    this.setState({
      paused: true
    });
    this.player.seek(0);
    this.player.dismissFullscreenPlayer();
  }
}

const styles = StyleSheet.create({
  container: {
      flex:1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageView: {
      flex: 1
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  thumbnailSelectionIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  fullScreenSelectionIcon: {
    position: 'absolute',
    top: 60,
    right: 16,
  },
  playBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent:"center"
  },
  playIcon: {
    width: 30,
    resizeMode: "contain",
    height: 30
  },
  gridPlayBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent:"center"
  },
  gridPlayIcon: {
    width: 15,
    resizeMode: "contain",
    height: 15
  }
});

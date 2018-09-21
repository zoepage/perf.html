/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
import { oneLine } from 'common-tags';
import * as React from 'react';
import explicitConnect from '../../utils/connect';
import MarkerSettings from '../shared/MarkerSettings';
import VirtualList from '../shared/VirtualList';
import NetworkChartEmptyReasons from './NetworkChartEmptyReasons';
import NetworkChartRow from './NetworkChartRow';

import {
  selectedThreadSelectors,
  getCommittedRange,
  getProfileInterval,
} from '../../reducers/profile-view';
import { getSelectedThreadIndex } from '../../reducers/url-state';
import { updatePreviewSelection } from '../../actions/profile-view';

import type { NetworkPayload } from '../../types/markers';
import type {
  TracingMarker,
  MarkerTimingRows,
} from '../../types/profile-derived';
import type {
  Milliseconds,
  UnitIntervalOfProfileRange,
} from '../../types/units';
import type {
  ExplicitConnectOptions,
  ConnectedProps,
} from '../../utils/connect';

require('./index.css');

const ROW_HEIGHT = 17.5;
// The window object is a custom definition that we are maintaining in src/types/globals/Window.js
// In order to use something, we expose the definition there. However, the window.screen
// is only supported in Firefox and Chrome, so I think we should find another value here.
const CONTAINER_WIDTH = 150 / window.screen.width * 100; // this will be replaced by the viewport

type DispatchProps = {|
  +updatePreviewSelection: typeof updatePreviewSelection,
|};

type StateProps = {|
  +markers: TracingMarker[],
  +networkTimingRows: MarkerTimingRows,
  +maxNetworkRows: number,
  +timeRange: { start: Milliseconds, end: Milliseconds },
  +interval: Milliseconds,
  +threadIndex: number,
|};

type Props = ConnectedProps<{||}, StateProps, DispatchProps>;

class NetworkChart extends React.PureComponent<Props> {
  /**
   * Determine the maximum zoom of the viewport.
   */
  getMaximumZoom(): UnitIntervalOfProfileRange {
    const { timeRange: { start, end }, interval } = this.props;
    return interval / (end - start);
  }

  _getMarkerPosition = markerStart => {
    const timeRange = this.props.timeRange;
    const timeRangeTotal = timeRange.end - timeRange.start;

    let markerPosition =
      (markerStart - timeRange.start) *
      (100 - CONTAINER_WIDTH) /
      timeRangeTotal;

    // the bar shall not overlap the first 150px as this is the thread label area.
    if (markerPosition < 0) {
      markerPosition = 0;
    }

    markerPosition = markerPosition + CONTAINER_WIDTH;

    return markerPosition;
  };

  _getMarkerLength = markerDuration => {
    const timeRange = this.props.timeRange;
    const timeRangeTotal = timeRange.end - timeRange.start;

    let markerLength =
      markerDuration * (100 - CONTAINER_WIDTH) / timeRangeTotal;

    if (markerLength < 0.1) {
      markerLength = 0.1;
    }

    return markerLength;
  };

  _getMarkerStyling = (marker: TracingMarker, payload: NetworkPayload) => {
    const markerLength = this._getMarkerLength(marker.dur);
    const markerPosition = this._getMarkerPosition(payload.startTime);

    const markerStyling = {
      width: markerLength + '%',
      left: markerPosition + '%',
    };
    return markerStyling;
  };

  /**
   * Our definition of tracing markers does not currently have the ability to refine
   * the union of all payloads to one specific payload through the type definition.
   * This function does a runtime check to do so.
   */
  _getNetworkPayloadOrNull(marker: TracingMarker): null | NetworkPayload {
    if (!marker.data || marker.data.type !== 'Network') {
      return null;
    }
    return marker.data;
  }

  _onCopy = (_event: Event) => {
    // No implemented.
  };

  _onKeyDown = (_event: KeyboardEvent) => {
    // No implemented.
  };

  // Create row with correct details
  _renderRow = (nodeId: any, index: number) => {
    const marker = this.props.markers[index];

    // Since our type definition for TracingMarker can't refine to just Network
    // markers, extract the payload.
    const networkPayload = this._getNetworkPayloadOrNull(marker);
    if (networkPayload === null) {
      console.error(
        oneLine`
          The NetworkChart is supposed to only receive Network markers, but some other
          kind of marker payload was passed in.
        `
      );
      return null;
    }

    return (
      <NetworkChartRow
        marker={marker}
        // Pass in the properly typed payload.
        networkPayload={networkPayload}
        index={index}
        markerStyle={this._getMarkerStyling(marker, networkPayload)}
        threadIndex={this.props.threadIndex}
      />
    );
  };

  render() {
    const { markers } = this.props;

    return (
      <div className="networkChart">
        <MarkerSettings />
        {markers.length === 0 ? (
          <NetworkChartEmptyReasons />
        ) : (
          <VirtualList
            className="treeViewBody"
            items={markers}
            renderItem={this._renderRow}
            itemHeight={ROW_HEIGHT}
            columnCount={1}
            focusable={true}
            specialItems={[]}
            containerWidth={3000}
            disableOverscan={true}
            onCopy={this._onCopy}
            onKeyDown={this._onKeyDown}
          />
        )}
      </div>
    );
  }
}

const options: ExplicitConnectOptions<{||}, StateProps, DispatchProps> = {
  mapStateToProps: state => {
    const networkTimingRows = selectedThreadSelectors.getNetworkChartTiming(
      state
    );
    return {
      markers: selectedThreadSelectors.getNetworkChartTracingMarkers(state),
      networkTimingRows,
      maxNetworkRows: networkTimingRows.length,
      timeRange: getCommittedRange(state),
      interval: getProfileInterval(state),
      threadIndex: getSelectedThreadIndex(state),
    };
  },
  component: NetworkChart,
};
export default explicitConnect(options);

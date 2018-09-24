/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import * as React from 'react';
import classNames from 'classnames';

import explicitConnect from '../../utils/connect';
import { selectedThreadSelectors } from '../../reducers/profile-view';
import { getSelectedThreadIndex } from '../../reducers/url-state';
import { formatMilliseconds } from '../../utils/format-numbers';

import type {
  ConnectedProps,
  ExplicitConnectOptions,
} from '../../utils/connect';
import type { ThreadIndex } from '../../types/profile';
import type {
  IndexIntoTracingMarkers,
  TracingMarker,
} from '../../types/profile-derived';

type CanCopyContentProps = {|
  +tagName?: string,
  +content: string,
  +className?: string,
|};

class CanSelectContent extends React.PureComponent<CanCopyContentProps> {
  _selectContent(e: SyntheticMouseEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    input.focus();
    input.select();
  }

  _unselectContent(e: SyntheticMouseEvent<HTMLInputElement>) {
    e.currentTarget.setSelectionRange(0, 0);
  }

  render() {
    const { tagName, content, className } = this.props;
    const TagName = tagName || 'div';

    return (
      <TagName
        className={classNames(className, 'can-select-content')}
        title={`${content}\n(click to select)`}
      >
        <input
          value={content}
          className="can-select-content-input"
          onFocus={this._selectContent}
          onBlur={this._unselectContent}
          readOnly={true}
        />
      </TagName>
    );
  }
}
type SidebarDetailProps = {|
  +label: string,
  +value: React.Node,
|};

function SidebarDetail({ label, value }: SidebarDetailProps) {
  return (
    <React.Fragment>
      <div className="sidebar-label">{label}:</div>
      <div className="sidebar-value">{value}</div>
    </React.Fragment>
  );
}

type StateProps = {|
  +selectedNodeIndex: IndexIntoTracingMarkers,
  +selectedThreadIndex: ThreadIndex,
  +markers: TracingMarker[],
|};

type Props = ConnectedProps<{||}, StateProps, {||}>;

class MarkerSidebar extends React.PureComponent<Props> {
  render() {
    const { selectedNodeIndex, markers } = this.props;

    if (selectedNodeIndex === null || selectedNodeIndex === -1) {
      return (
        <div className="sidebar sidebar-calltree">
          Select a marker to display some information about it.
        </div>
      );
    }

    const selectedMarker = markers[selectedNodeIndex];

    console.log('🤖🤖🤖🤖', selectedMarker);

    return (
      <aside className="sidebar sidebar-calltree">
        <div className="sidebar-contents-wrapper">
          <header className="sidebar-titlegroup">
            <CanSelectContent
              tagName="h2"
              className="sidebar-title"
              content={selectedMarker.name}
            />
          </header>
          <h3 className="sidebar-title2">General:</h3>

          {selectedMarker.dur ? (
            <SidebarDetail
              label="Duration"
              value={formatMilliseconds(selectedMarker.dur)}
            />
          ) : null}

          {selectedMarker.data ? (
            <React.Fragment>
              <h3 className="sidebar-title2">Details:</h3>
              {selectedMarker.data.type ? (
                <SidebarDetail label="Type" value={selectedMarker.data.type} />
              ) : null}

              {selectedMarker.data.category ? (
                <SidebarDetail
                  label="Category"
                  value={selectedMarker.data.category}
                />
              ) : null}

              {selectedMarker.data.interval ? (
                <SidebarDetail
                  label="Interval"
                  value={selectedMarker.data.interval}
                />
              ) : null}
            </React.Fragment>
          ) : null}
        </div>
      </aside>
    );
  }
}

const options: ExplicitConnectOptions<{||}, StateProps, {||}> = {
  mapStateToProps: state => ({
    selectedNodeIndex: selectedThreadSelectors.getViewOptions(state)
      .selectedMarker,
    markers: selectedThreadSelectors.getPreviewFilteredTracingMarkers(state),
    selectedThreadIndex: getSelectedThreadIndex(state),
  }),
  component: MarkerSidebar,
};

export default explicitConnect(options);
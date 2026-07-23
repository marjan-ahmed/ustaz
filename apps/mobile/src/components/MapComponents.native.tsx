import { Component, type ReactNode } from 'react';
import { View, Text } from 'react-native';
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError(error: any) {
    console.error('[MapErrorBoundary] map crashed:', error?.message ?? error);
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', padding: 20 }}>
            Map failed to load. Please check your Google Maps API key configuration.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function SafeMapView(props: any) {
  return (
    <MapErrorBoundary>
      <MapView {...props} />
    </MapErrorBoundary>
  );
}

export { SafeMapView as MapView, Circle, Marker, Polyline, PROVIDER_GOOGLE };

## Kubernetes/Container Engine Visualizer

This is a simple visualizer for use with the Kubernetes API.

### Usage:
   * First install a Kubernetes or Container Engine Cluster
   * ```git clone https://github.com/saturnism/gcp-live-k8s-visualizer.git```
   * ```kubectl proxy -p 8080 -w =path/to/gcp-live-k8s-visualizer```

You can then access the visualizer via:
   * `http://localhost:8080/static/`

If you need to connect to it via non-localhost IP, then you need to start the proxy differently:
   * `kubectl proxy -p 8080 --accept-hosts=".*" -w =path/to/gcp-live-k8s-visualizer`

That's it.  The visualizer uses labels to organize the visualization.  In particular it expects that

   * pods, replicationcontrollers, and services have a ```name``` label, and pods and their associated replication controller share the same ```name```, and
   * the pods in your cluster will have a ```uses``` label which contains a underscore separated list of services that the pod uses.
   * resources that you want to show in the visualizer should have ```visualize``` label set to the value ```true```

### Using Grunt
To use Grunt while developing, run `npm install` and then run `grunt serve`.
Change the `connect.proxies.host` and/or `connect.proxies.port` in the Gruntfile to reflect the hostname of the Kubernetes API

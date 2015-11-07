## Kubernetes/Container Engine Visualizer

This is a simple visualizer for use with the Kubernetes API.

### Usage:
   * First install a Kubernetes or Container Engine Cluster
   * ```git clone https://github.com/saturnism/gcp-live-k8s-visualizer.git```
   * ```kubectl proxy -p 8080 --www=path/to/gcp-live-k8s-visualizer```

That's it.  The visualizer uses labels to organize the visualization.  In particular it expects that

   * pods, replicationcontrollers, and services have a ```name``` label, and pods and their associated replication controller share the same ```name```, and
   * the pods in your cluster will have a ```uses``` label which contains a underscore separated list of services that the pod uses.
   * resources that you want to show in the visualizer should have ```visualize``` label set to the value ```true```

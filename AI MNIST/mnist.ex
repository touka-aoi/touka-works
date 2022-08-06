defmodule WsbappWeb.BlogLive.Ai.Mnist do
  use WsbappWeb, :live_view

  @impl Phoenix.LiveView
  def mount(_params, _session, socket) do
    {:ok, socket}
  end

  def handle_event("predict", _params, socket) do
    {:noreply, push_event(socket, "predict", %{})}
  end

  def handle_event("testEvent", _parms, socket) do
    {:noreply, socket}
  end


end

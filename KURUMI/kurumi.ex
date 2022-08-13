defmodule WsbappWeb.BlogLive.Kurumi do
  use WsbappWeb, :live_view

  def mount(_params, _session, socket) do
    dir = Path.join([:code.priv_dir(:wsbapp), "static", "tmp"])
    file_list = File.ls!(dir)
    for file_path <- file_list do
      path = Path.join(dir, file_path)
      File.rm!(path)
    end
    socket = 
      socket 
      |> allow_upload(:avatar, accept: ~w(.jpg .png .jpeg), max_entries: 1)
      |> assign(:hide, "show")
    {:ok, socket}
  end

  def handle_event("validate", _params, socket) do
    {:noreply, socket}
  end

  def handle_event("genelu", _params, socket) do
      path = consume_uploaded_entries(socket, :avatar, fn %{path: path}, _entry ->      
        dst = Path.join([:code.priv_dir(:wsbapp), "static", "tmp", Path.basename(path)])
        File.cp!(path, dst)
        jsPath = Path.join(["../", "tmp", Path.basename(path)])
        {:ok, jsPath}
      end)
      socket = 
        socket 
          |> push_event("genelu", %{path: path})
          |> assign(:hide, "hide")
    {:noreply, socket}
  end

  def handle_event("cancelu", %{"ref" => ref}, socket) do
    socket = 
      socket 
        |> cancel_upload(:avatar, ref)
        |> push_event("init", %{})
    {:noreply, socket}
  end

  def handle_event("replay", _params, socket) do
    socket = 
      socket 
        |> push_event("replay", %{})
    {:noreply, socket}
  end

  def handle_event("back-top", _params, socket) do
    socket = 
        socket 
          |> push_event("init", %{})
          |> assign(:hide, "show")
    {:noreply, socket}
  end
  



end
